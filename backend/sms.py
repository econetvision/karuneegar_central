import os
import random
import logging
import urllib.request
import urllib.parse
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

    provider = os.environ.get('SMS_PROVIDER', 'twilio').lower()
    if provider == 'twilio':
        return _twilio(mobile, otp)
    if provider == 'fast2sms':
        return _fast2sms(mobile, otp)

    logger.error('Unknown SMS_PROVIDER: %s', provider)
    return False


def _twilio(mobile: str, otp: str) -> bool:
    try:
        from twilio.rest import Client  # optional dep
        client = Client(os.environ['TWILIO_ACCOUNT_SID'], os.environ['TWILIO_AUTH_TOKEN'])
        client.messages.create(
            body=f'Your Karuneegar Central verification code is {otp}. Valid for 10 minutes.',
            from_=os.environ['TWILIO_FROM'],
            to=mobile,
        )
        return True
    except Exception as exc:
        logger.error('Twilio error: %s', exc)
        return False


def _fast2sms(mobile: str, otp: str) -> bool:
    """Fast2SMS OTP route — good for Indian numbers."""
    try:
        payload = json.dumps({
            'route': 'otp',
            'variables_values': otp,
            'numbers': mobile.lstrip('+91').lstrip('+'),
        }).encode()
        req = urllib.request.Request(
            'https://www.fast2sms.com/dev/bulkV2',
            data=payload,
            headers={
                'authorization': os.environ['FAST2SMS_API_KEY'],
                'Content-Type': 'application/json',
            },
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read())
            return body.get('return') is True
    except Exception as exc:
        logger.error('Fast2SMS error: %s', exc)
        return False
