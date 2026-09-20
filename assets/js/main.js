document.addEventListener('DOMContentLoaded', () => {
  prefillExperienceField();
  initPhoneInput();
});

function prefillExperienceField() {
  const params = new URLSearchParams(window.location.search);
  const experience = params.get('experience');
  if (!experience) return;

  const field = document.querySelector('input[name="experience"]');
  if (field && !field.value) {
    field.value = decodeURIComponent(experience);
  }

  if (window.location.hash === '#contact') {
    const contact = document.getElementById('contact');
    if (contact) {
      setTimeout(() => contact.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
  }
}

function initPhoneInput() {
  const phoneInputField = document.querySelector('#phone');
  if (!phoneInputField || !window.intlTelInput) return;

  window.intlTelInput(phoneInputField, {
    initialCountry: 'auto',
    separateDialCode: true,
    allowDropdown: true,
    countrySearch: true,
    geoIpLookup: (callback) => {
      fetch('https://ipapi.co/json')
        .then((res) => res.json())
        .then((data) => callback(data.country_code))
        .catch(() => callback('in'));
    },
    utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js'
  });

  phoneInputField.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
  });
}
