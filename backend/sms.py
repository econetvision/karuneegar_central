import os
import secrets
import logging
import urllib.request
import urllib.parse
import urllib.error
import json

logger = logging.getLogger(__name__)

OTP_MESSAGE = 'Your Karuneegar Central verification code is {otp}. Valid for 10 minutes.'


def generate_otp() -> str:
    return str(secrets.randbelow(90000) + 10000)


def send_otp_sms(mobile: str, otp: str) -> bool:
    """Send OTP via SMS. If SMS fails, fall back to WhatsApp."""
    if os.environ.get('MOCK_SMS', 'false').lower() == 'true':
        logger.warning('MOCK SMS | mobile=%s otp=<redacted>', mobile)
        print(f'\n{"="*40}\nMOCK SMS  ->  {mobile}\nOTP CODE  ->  {otp}\n{"="*40}\n', flush=True)
        return True

    sms_ok = _send_sms(mobile, otp)
    if sms_ok:
        return True

    logger.warning('SMS delivery failed for %s — trying WhatsApp fallback', mobile)
    return _send_whatsapp(mobile, otp)


# ── SMS delivery ──────────────────────────────────────────────────────────────

def _send_sms(mobile: str, otp: str) -> bool:
    # Default to twofactor — it's the configured provider on this project.
    # If you use Twilio or Fast2SMS, set SMS_PROVIDER=twilio or fast2sms.
    provider = os.environ.get('SMS_PROVIDER', 'twofactor').strip().lower()
    logger.info('SMS_PROVIDER=%r  mobile=%s', provider, mobile)
    if provider == 'twofactor':
        return _twofactor_sms(mobile, otp)
    if provider == 'twilio':
        return _twilio_sms(mobile, otp)
    if provider == 'fast2sms':
        return _fast2sms(mobile, otp)
    logger.error('Unknown SMS_PROVIDER: %r (check env var)', provider)
    return False


def _twilio_sms(mobile: str, otp: str) -> bool:
    try:
        from twilio.rest import Client
    except ImportError:
        logger.error('Twilio package not installed. Run: pip install twilio')
        return False

    sid   = os.environ.get('TWILIO_ACCOUNT_SID')
    token = os.environ.get('TWILIO_AUTH_TOKEN')
    from_ = os.environ.get('TWILIO_FROM')
    if not sid or not token or not from_:
        logger.error(
            'Missing Twilio env vars — TWILIO_ACCOUNT_SID=%s, TWILIO_AUTH_TOKEN=%s, TWILIO_FROM=%s',
            'set' if sid else 'MISSING',
            'set' if token else 'MISSING',
            from_ or 'MISSING',
        )
        return False

    try:
        client = Client(sid, token)
        client.messages.create(
            body=OTP_MESSAGE.format(otp=otp),
            from_=from_,
            to=mobile,
        )
        logger.info('Twilio SMS sent to %s', mobile)
        return True
    except Exception as exc:
        logger.error('Twilio SMS error: %s', exc)
        return False


def _twofactor_sms(mobile: str, otp: str) -> bool:
    """2Factor.in transactional SMS OTP.

    URL format (no template — uses 2Factor's built-in OTP message):
      https://2factor.in/API/V1/{api_key}/SMS/{number}/{otp}

    If you have a DLT-registered template, set TWOFACTOR_SMS_TEMPLATE to its
    name and the URL becomes .../SMS/{number}/{otp}/{template}.
    """
    api_key = os.environ.get('TWOFACTOR_API_KEY')
    if not api_key:
        logger.error('2Factor: TWOFACTOR_API_KEY env var is MISSING')
        return False

    number = mobile[3:] if mobile.startswith('+91') else mobile.lstrip('+')
    template = os.environ.get('TWOFACTOR_SMS_TEMPLATE', '').strip()

    if template:
        url = f'https://2factor.in/API/V1/{api_key}/SMS/{number}/{otp}/{template}'
        logger.info('2Factor SMS (template=%s): number=%s', template, number)
    else:
        url = f'https://2factor.in/API/V1/{api_key}/SMS/{number}/{otp}'
        logger.info('2Factor SMS (no template): number=%s', number)

    try:
        with urllib.request.urlopen(urllib.request.Request(url), timeout=10) as resp:
            body = json.loads(resp.read())
            logger.info('2Factor SMS response: %s', body)
            if body.get('Status') == 'Success':
                return True
            logger.error('2Factor SMS failed — Status=%s Details=%s', body.get('Status'), body.get('Details'))
            return False
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode('utf-8', errors='replace')
        logger.error('2Factor SMS HTTP %s: %s', exc.code, raw)
        return False
    except Exception as exc:
        logger.error('2Factor SMS error: %s', exc)
        return False


def _fast2sms(mobile: str, otp: str) -> bool:
    """Fast2SMS OTP route — good for Indian numbers."""
    api_key = os.environ.get('FAST2SMS_API_KEY')
    if not api_key:
        logger.error('Fast2SMS: FAST2SMS_API_KEY env var is MISSING')
        return False

    number = mobile[3:] if mobile.startswith('+91') else mobile.lstrip('+')
    logger.info('Fast2SMS SMS: number=%s', number)

    payload = json.dumps({
        'route': 'otp',
        'variables_values': otp,
        'numbers': number,
    }).encode()
    req = urllib.request.Request(
        'https://www.fast2sms.com/dev/bulkV2',
        data=payload,
        headers={
            'authorization': api_key,
            'Content-Type': 'application/json',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read())
            logger.info('Fast2SMS SMS response: %s', body)
            return body.get('return') is True
    except urllib.error.HTTPError as exc:
        logger.error('Fast2SMS HTTP %s: %s', exc.code, exc.read().decode('utf-8', errors='replace'))
        return False
    except Exception as exc:
        logger.error('Fast2SMS SMS error: %s', exc)
        return False


# ── WhatsApp fallback ─────────────────────────────────────────────────────────

def _send_whatsapp(mobile: str, otp: str) -> bool:
    """Try WhatsApp providers in order of availability.

    2Factor WhatsApp is skipped here because when SMS_PROVIDER=twofactor and
    the SMS already failed, re-using the same 2Factor account for the fallback
    risks triggering a voice call on accounts not enabled for WhatsApp.
    Use Twilio or Fast2SMS for the WhatsApp fallback instead.
    """
    if os.environ.get('TWILIO_ACCOUNT_SID') and os.environ.get('TWILIO_WHATSAPP_FROM'):
        if _twilio_whatsapp(mobile, otp):
            return True

    if os.environ.get('FAST2SMS_API_KEY'):
        if _fast2sms_whatsapp(mobile, otp):
            return True

    if os.environ.get('TWOFACTOR_API_KEY') and os.environ.get('TWOFACTOR_WHATSAPP_TEMPLATE'):
        # Only use 2Factor WhatsApp if a specific WhatsApp template is configured.
        if _twofactor_whatsapp(mobile, otp):
            return True

    logger.error('All WhatsApp fallback providers failed for %s', mobile)
    return False


def _twofactor_whatsapp(mobile: str, otp: str) -> bool:
    """2Factor.in WhatsApp OTP delivery."""
    api_key = os.environ.get('TWOFACTOR_API_KEY')
    if not api_key:
        return False

    number = mobile[3:] if mobile.startswith('+91') else mobile.lstrip('+')
    template = os.environ.get('TWOFACTOR_WHATSAPP_TEMPLATE', 'otp1')
    url = f'https://2factor.in/API/V1/{api_key}/WHATSAPP/{template}/{number}/{otp}'
    logger.info('2Factor WhatsApp: number=%s template=%s', number, template)

    try:
        with urllib.request.urlopen(urllib.request.Request(url), timeout=10) as resp:
            body = json.loads(resp.read())
            logger.info('2Factor WhatsApp response: %s', body)
            if body.get('Status') == 'Success':
                return True
            logger.warning('2Factor WhatsApp non-success: %s', body)
            return False
    except urllib.error.HTTPError as exc:
        logger.warning('2Factor WhatsApp HTTP %s: %s', exc.code, exc.read().decode('utf-8', errors='replace'))
        return False
    except Exception as exc:
        logger.warning('2Factor WhatsApp error: %s', exc)
        return False


def _twilio_whatsapp(mobile: str, otp: str) -> bool:
    """Twilio WhatsApp OTP delivery. Requires TWILIO_WHATSAPP_FROM env var
    (e.g. 'whatsapp:+14155238886' for sandbox or your approved WA business number)."""
    try:
        from twilio.rest import Client
    except ImportError:
        logger.warning('Twilio package not installed — WhatsApp fallback skipped')
        return False

    sid       = os.environ.get('TWILIO_ACCOUNT_SID')
    token     = os.environ.get('TWILIO_AUTH_TOKEN')
    from_     = os.environ.get('TWILIO_WHATSAPP_FROM')  # e.g. whatsapp:+14155238886
    if not sid or not token or not from_:
        return False

    to = f'whatsapp:{mobile}' if not mobile.startswith('whatsapp:') else mobile
    try:
        client = Client(sid, token)
        client.messages.create(
            body=OTP_MESSAGE.format(otp=otp),
            from_=from_,
            to=to,
        )
        logger.info('Twilio WhatsApp sent to %s', mobile)
        return True
    except Exception as exc:
        logger.warning('Twilio WhatsApp error: %s', exc)
        return False


def _fast2sms_whatsapp(mobile: str, otp: str) -> bool:
    """Fast2SMS WhatsApp OTP delivery."""
    api_key = os.environ.get('FAST2SMS_API_KEY')
    if not api_key:
        return False

    number = mobile[3:] if mobile.startswith('+91') else mobile.lstrip('+')
    logger.info('Fast2SMS WhatsApp: number=%s', number)

    payload = json.dumps({
        'route': 'whatsapp',
        'message': OTP_MESSAGE.format(otp=otp),
        'numbers': number,
    }).encode()
    req = urllib.request.Request(
        'https://www.fast2sms.com/dev/bulkV2',
        data=payload,
        headers={
            'authorization': api_key,
            'Content-Type': 'application/json',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read())
            logger.info('Fast2SMS WhatsApp response: %s', body)
            return body.get('return') is True
    except urllib.error.HTTPError as exc:
        logger.warning('Fast2SMS WhatsApp HTTP %s: %s', exc.code, exc.read().decode('utf-8', errors='replace'))
        return False
    except Exception as exc:
        logger.warning('Fast2SMS WhatsApp error: %s', exc)
        return False
