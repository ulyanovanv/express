/* eslint-disable */
// const axios = require('axios').default; //require does not exist on client side
import axios from 'axios';
import { showAlert } from './alerts.js'

export const login = async (email, password) => {
  try {
    const res = await axios.post('/api/v1/users/login', {
      email,
      password
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in succesfully!');
      window.setTimeout(() => {
        location.assign('/')
      }, 1500)
    }
  } catch(error) {
    showAlert('error', error.response.data.message);
  }
}

export const logout = async () => {
  try {
    const res = await axios.get('/api/v1/users/logout');

    if (res.data.status === 'success') {
      location.reload(true);
    }
  } catch(err) {
    showAlert('error', 'Error logging out? Try again.');
  }
}