"""Unit tests for SMS helper functions in sms.py."""
import os
import json
import pytest
from unittest.mock import patch, MagicMock
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
import sms as sms_module


class TestGenerateOtp:
    def test_returns_5_digit_string(self):
        otp = sms_module.generate_otp()
        assert isinstance(otp, str)
        assert len(otp) == 5
        assert otp.isdigit()

    def test_generates_different_otps(self):
        otps = {sms_module.generate_otp() for _ in range(20)}
        assert len(otps) > 1  # not always the same value


class TestSendOtpAutogen:
    def test_mock_mode_returns_otp(self, monkeypatch):
        monkeypatch.setenv("MOCK_SMS", "true")
        result = sms_module.send_otp_autogen("+919876543210")
        assert result is not None
        assert result.isdigit()
        assert len(result) == 5

    def test_missing_api_key_returns_none(self, monkeypatch):
        monkeypatch.setenv("MOCK_SMS", "false")
        monkeypatch.delenv("TWOFACTOR_API_KEY", raising=False)
        result = sms_module.send_otp_autogen("+919876543210")
        assert result is None

    def test_http_success_response_parsed(self, monkeypatch):
        monkeypatch.setenv("MOCK_SMS", "false")
        monkeypatch.setenv("TWOFACTOR_API_KEY", "fake-key")
        fake_body = json.dumps({"Status": "Success", "Details": "654321"}).encode()

        mock_resp = MagicMock()
        mock_resp.read.return_value = fake_body
        mock_resp.__enter__ = lambda s: s
        mock_resp.__exit__ = MagicMock(return_value=False)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            result = sms_module.send_otp_autogen("+919876543210")
        assert result == "654321"

    def test_http_failure_status_returns_none(self, monkeypatch):
        monkeypatch.setenv("MOCK_SMS", "false")
        monkeypatch.setenv("TWOFACTOR_API_KEY", "fake-key")
        fake_body = json.dumps({"Status": "Error", "Details": "Invalid API key"}).encode()

        mock_resp = MagicMock()
        mock_resp.read.return_value = fake_body
        mock_resp.__enter__ = lambda s: s
        mock_resp.__exit__ = MagicMock(return_value=False)

        with patch("urllib.request.urlopen", return_value=mock_resp):
            result = sms_module.send_otp_autogen("+919876543210")
        assert result is None

    def test_strips_country_code_for_indian_number(self, monkeypatch):
        monkeypatch.setenv("MOCK_SMS", "false")
        monkeypatch.setenv("TWOFACTOR_API_KEY", "mykey")
        captured_url = []

        def fake_urlopen(req, timeout=None):
            captured_url.append(req.full_url if hasattr(req, "full_url") else str(req))
            raise Exception("abort")

        with patch("urllib.request.urlopen", fake_urlopen):
            sms_module.send_otp_autogen("+919876543210")

        if captured_url:
            assert "9876543210" in captured_url[0]
            assert "+91" not in captured_url[0]


class TestSendOtpSms:
    def test_mock_mode_returns_true(self, monkeypatch):
        monkeypatch.setenv("MOCK_SMS", "true")
        result = sms_module.send_otp_sms("+919876543210", "12345")
        assert result is True
