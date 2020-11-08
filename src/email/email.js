
const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)


const sendWelComeEmail = (email, name) => {
    sgMail.send(
        {
            to: email, // Change to your recipient
            from: 'sauravjha24@gmail.com', // Change to your verified sender
            subject: 'Welcome email',
            text: `Welcome to ${name} task App`,
            html: '<strong>and easy to do anywhere, even with Node.js</strong>',
          }
    ).then(() => {
        console.log('Email sent')
      })
      .catch((error) => {
        console.error(error)
      })
}

const sendGoodByeEmail = (email, name) => {
    sgMail.send(
        {
            to: email, // Change to your recipient
            from: 'sauravjha24@gmail.com', // Change to your verified sender
            subject: `Goodbuy to ${name} task App`,
            text: `Goodbuy to ${name} task App`,
            html: `<strong>Sorry to see you gone ${name}</strong>`,
          }
    ).then(() => {
        console.log('Email sent')
      })
      .catch((error) => {
        console.error(error)
      })
}

module.exports = {
    sendWelComeEmail,
    sendGoodByeEmail
}