import os
import random
import logging
import urllib.request
import urllib.parse
import urllib.error
import json

logger = logging.getLogger(__name__)


def generate_otp() -> str:
    return str(random.randint(10000, 99999))


def send_otp_sms(mobile: str, otp: str) -> bool:
    """Send OTP via configured provider. Returns True on success."""
    if os.environ.get('MOCK_SMS', 'true').lower() == 'true':
        logger.warning('MOCK SMS | mobile=%s otp=%s', mobile, otp)
        print(f'\n{"="*40}\nMOCK SMS  ->  {mobile}\nOTP CODE  ->  {otp}\n{"="*40}\n', flush=True)
        return True

    provider = os.environ.get('SMS_PROVIDER', 'twilio').strip().lower()
    logger.info('SMS_PROVIDER resolved to: %r', provider)
    if provider == 'twilio':
        return _twilio(mobile, otp)
    if provider == 'fast2sms':
        return _fast2sms(mobile, otp)
    if provider == 'twofactor':
        return _twofactor(mobile, otp)

    logger.error('Unknown SMS_PROVIDER: %r (check Render env var)', provider)
    return False


def _twilio(mobile: str, otp: str) -> bool:
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
            body=f'Your Karuneegar Central verification code is {otp}. Valid for 10 minutes.',
            from_=from_,
            to=mobile,
        )
        logger.info('Twilio SMS sent to %s', mobile)
        return True
    except Exception as exc:
        logger.error('Twilio API error: %s', exc)
        return False


def _twofactor(mobile: str, otp: str) -> bool:
    """2Factor.in OTP API — simple GET, no website verification needed."""
    api_key = os.environ.get('TWOFACTOR_API_KEY')
    if not api_key:
        logger.error('2Factor: TWOFACTOR_API_KEY env var is MISSING')
        return False

    number = mobile[3:] if mobile.startswith('+91') else mobile.lstrip('+')
    logger.info('2Factor: sending OTP to number=%s', number)

    url = f'https://2factor.in/API/V1/{api_key}/SMS/{number}/{otp}/OTP1'
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read())
            logger.info('2Factor response: %s', body)
            return body.get('Status') == 'Success'
    except urllib.error.HTTPError as exc:
        body = exc.read().decode('utf-8', errors='replace')
        logger.error('2Factor HTTP %s: %s', exc.code, body)
        return False
    except Exception as exc:
        logger.error('2Factor error: %s', exc)
        return False


def _fast2sms(mobile: str, otp: str) -> bool:
    """Fast2SMS OTP route — good for Indian numbers."""
    api_key = os.environ.get('FAST2SMS_API_KEY')
    if not api_key:
        logger.error('Fast2SMS: FAST2SMS_API_KEY env var is MISSING')
        return False

    number = mobile[3:] if mobile.startswith('+91') else mobile.lstrip('+')
    logger.info('Fast2SMS: sending OTP to number=%s', number)

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
            logger.info('Fast2SMS response: %s', body)
            return body.get('return') is True
    except urllib.error.HTTPError as exc:
        body = exc.read().decode('utf-8', errors='replace')
        logger.error('Fast2SMS HTTP %s: %s', exc.code, body)
        return False
    except Exception as exc:
        logger.error('Fast2SMS error: %s', exc)
        return False
