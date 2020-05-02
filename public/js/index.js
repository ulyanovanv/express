import '@babel/polyfill'; //to support old browsers
import { displayMap } from './mapbox.js';
import { login, logout } from './login.js';
import { updateSettings } from './updateSettings.js';
import { bookTour } from './stripe.js';

const map = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-settings');
const btnSaveSettings = document.querySelector('.btn-save-seetings');
const btnSavePassword = document.querySelector('.btn-save-password');
const btnBook = document.getElementById('book-tour');

//MAPBOX
if (map) {
  const locations = JSON.parse(map.dataset.locations);
  displayMap(locations);
}

//LOGIN LAVIDATION
if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

//LOGOUT
if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

//UPDATE DATA OF USER
if (updateForm) {
  btnSaveSettings.addEventListener('click', e => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const photo = document.getElementById('photo').files[0];

    const form = new FormData();
    form.append('name', name)
    form.append('email', email)
    form.append('photo', photo)

    updateSettings(form, 'data');
  })
}

//UPDATE USER PASSWORD
if (updatePasswordForm) {
  btnSavePassword.addEventListener('click', async (e) => {
    e.preventDefault();
    btnSavePassword.textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings({passwordCurrent, password, passwordConfirm}, 'password');
    btnSavePassword.textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  })
}

if (btnBook) {
  btnBook.addEventListener('click', e => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  })
}