const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.from = `Anna Polsha <${process.env.EMAIL_FROM}>`;
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
  }

  //1. create a transporter - service that sends a email
  newTransport() {
    if (process.env.NODE_ENV === 'production') {

      //sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: '',
          pass: ''
        }
      });
    } else {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      })
    }
  }

  //2. define the email options
  async send(template, subject) {
    //render HTMl based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    //define email options
    const emailOptions = {
      from: this.from,
      to:  this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
    }

    //create a transport and send email
    await this.newTransport().sendMail(emailOptions)
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours family!');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset token (valid for 10 minutes)');
  }
}
