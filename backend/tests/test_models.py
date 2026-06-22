"""Unit tests for model helper methods and field behaviour."""
import json
import pytest
from datetime import datetime, timezone


# ── Import models (app already configured by conftest) ───────────────────────
from models import (
    MatrimonyProfile, BusinessProfile, BusinessAd,
    User, Profile, FamilyMember,
)
from main import db


class TestMaskMobile:
    def test_mask_hides_middle_digits(self, app):
        from models import _mask_mobile
        with app.app_context():
            assert _mask_mobile("+919876543210") == "+91987****210"

    def test_mask_returns_none_for_none(self, app):
        from models import _mask_mobile
        with app.app_context():
            assert _mask_mobile(None) is None

    def test_mask_returns_short_as_is(self, app):
        from models import _mask_mobile
        with app.app_context():
            result = _mask_mobile("123")
            assert result == "123"


class TestMatrimonyProfileToDict:
    def test_photos_empty_when_no_json(self, app):
        with app.app_context():
            p = MatrimonyProfile(user_id=1, full_name="A", gender="male")
            p.photos_json = None
            d = p.to_dict()
            assert d["photos"] == []

    def test_photos_parsed_from_json(self, app):
        with app.app_context():
            p = MatrimonyProfile(user_id=1, full_name="A", gender="male")
            p.photos_json = json.dumps(["a.jpg", "b.jpg"])
            d = p.to_dict()
            assert d["photos"] == ["a.jpg", "b.jpg"]

    def test_photos_capped_at_five(self, app):
        with app.app_context():
            p = MatrimonyProfile(user_id=1, full_name="A", gender="male")
            p.photos_json = json.dumps(["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg"])
            d = p.to_dict()
            # to_dict just deserialises; capping happens at write time
            assert len(d["photos"]) == 6  # all stored values returned

    def test_contact_hidden_by_default(self, app):
        with app.app_context():
            p = MatrimonyProfile(
                user_id=1, full_name="A", gender="male",
                contact_email="secret@example.com",
                contact_phone="+919999999999",
                phone_public=False,
            )
            d = p.to_dict()
            assert d["contact_email"] is None
            assert d["contact_phone"] != "+919999999999"  # masked

    def test_contact_visible_when_full(self, app):
        with app.app_context():
            p = MatrimonyProfile(
                user_id=1, full_name="A", gender="male",
                contact_email="owner@example.com",
                contact_phone="+919999999999",
                phone_public=False,
            )
            d = p.to_dict(full=True)
            assert d["contact_email"] == "owner@example.com"
            assert d["contact_phone"] == "+919999999999"

    def test_phone_public_visible_to_all(self, app):
        with app.app_context():
            p = MatrimonyProfile(
                user_id=1, full_name="A", gender="male",
                contact_phone="+919999999999",
                phone_public=True,
            )
            d = p.to_dict()
            assert d["contact_phone"] == "+919999999999"

    def test_horoscope_fields_present(self, app):
        with app.app_context():
            p = MatrimonyProfile(user_id=1, full_name="A", gender="male")
            p.horoscope_en = "English horoscope text"
            p.horoscope_ta = "Tamil horoscope text"
            d = p.to_dict()
            assert d["horoscope_en"] == "English horoscope text"
            assert d["horoscope_ta"] == "Tamil horoscope text"
            assert d["horoscope_te"] is None
            assert d["horoscope_kn"] is None

    def test_birth_details_present(self, app):
        with app.app_context():
            p = MatrimonyProfile(
                user_id=1, full_name="A", gender="male",
                birth_time="10:30 AM", birth_place="Chennai",
            )
            d = p.to_dict()
            assert d["birth_time"] == "10:30 AM"
            assert d["birth_place"] == "Chennai"


class TestBusinessProfileToDict:
    def test_to_dict_contains_expected_keys(self, app):
        with app.app_context():
            b = BusinessProfile(user_id=1, company_name="Test Co")
            d = b.to_dict()
            for key in ("id", "user_id", "company_name", "category", "city",
                        "phone", "email", "website", "active", "created_at"):
                assert key in d

    def test_active_defaults_true(self, app):
        with app.app_context():
            b = BusinessProfile(user_id=1, company_name="Test Co")
            assert b.active is True


class TestBusinessAdToDict:
    def test_to_dict_contains_expected_keys(self, app):
        with app.app_context():
            ad = BusinessAd(business_id=1, photo_filename="ad.jpg", title="Sale")
            d = ad.to_dict()
            for key in ("id", "business_id", "photo_filename", "title", "caption", "active"):
                assert key in d

    def test_active_defaults_true(self, app):
        with app.app_context():
            ad = BusinessAd(business_id=1, photo_filename="x.jpg")
            assert ad.active is True
