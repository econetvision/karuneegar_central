import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


def send_otp_email(to_email: str, otp: str) -> bool:
    if os.environ.get('MOCK_SMS', 'true').lower() == 'true':
        logger.warning('MOCK EMAIL OTP | to=%s otp=%s', to_email, otp)
        print(f'\n{"="*40}\nMOCK EMAIL OTP  ->  {to_email}\nOTP CODE        ->  {otp}\n{"="*40}\n', flush=True)
        return True

    host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    port = int(os.environ.get('SMTP_PORT', '587'))
    user = os.environ.get('SMTP_USER')
    password = os.environ.get('SMTP_PASS')
    from_addr = os.environ.get('SMTP_FROM', user)

    if not user or not password:
        logger.error(
            'Missing SMTP env vars — SMTP_USER=%s SMTP_PASS=%s',
            'set' if user else 'MISSING',
            'set' if password else 'MISSING',
        )
        return False

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'{otp} is your Karuneegar Central verification code'
    msg['From'] = f'Karuneegar Central <{from_addr}>'
    msg['To'] = to_email

    text = (
        f'Your Karuneegar Central verification code is {otp}.\n'
        'Valid for 10 minutes. Do not share this code with anyone.'
    )
    html = f"""
    <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:24px">
      <h2 style="color:#c2410c;margin-bottom:4px">Karuneegar Central</h2>
      <p style="color:#374151;margin-top:0">Your verification code:</p>
      <div style="font-size:40px;font-weight:700;letter-spacing:0.3em;color:#c2410c;
                  padding:24px;background:#fff7ed;border-radius:12px;text-align:center">
        {otp}
      </div>
      <p style="color:#6b7280;font-size:13px;margin-top:16px">
        Valid for 10 minutes. Do not share this code with anyone.
      </p>
    </div>
    """

    msg.attach(MIMEText(text, 'plain'))
    msg.attach(MIMEText(html, 'html'))

    try:
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.login(user, password)
            server.sendmail(from_addr, to_email, msg.as_string())
        logger.info('Email OTP sent to %s', to_email)
        return True
    except Exception as exc:
        logger.error('SMTP error: %s', exc)
        return False
