import axios from 'axios';
import { showAlert } from './alerts.js'

//type - password or data
export const updateSettings = async (data, type) => {
  try {
    const url = type === 'password' ? '/api/v1/users/updateMyPassword' : '/api/v1/users/updateMe';
    const res = await axios.patch(url, data);

    if (res.data.status === 'success') {
      showAlert('success', 'Data updated successfully');
      window.setTimeout(() => {
        location.reload(true)
      }, 1500)
    }
  } catch(error) {
    showAlert('error', error.response.data.message);
  }
}