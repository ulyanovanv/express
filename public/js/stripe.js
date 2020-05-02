/* eslint-disable */

import axios from 'axios';
const stripe = Stripe('pk_test_bw2zCTzJwOV3BnWmWT9fnwT500gitWFxBX');

import { showAlert } from './alerts.js'

export const bookTour = async tourId => {
  // 1) Get a session from API
  try {
    const session = await axios.get(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);

    // 2) Create checkout form + charge credit card for us
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    })
  } catch(err) {
    console.log(err)
    showAlert('error', err.response.data.message);
  }
}