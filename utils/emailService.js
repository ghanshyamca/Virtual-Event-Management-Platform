const nodemailer = require('nodemailer');
const { EMAIL, DEV } = require('../config/constants');

// Create email transporter
const createTransporter = () => {
  // For development, use a test account or console logging
  if (DEV.TEST_MODE || (!EMAIL.HOST || !EMAIL.USER)) {
    return {
      sendMail: async (mailOptions) => {
        if (DEV.ENABLE_LOGGING) {
          console.log('📧 Email would be sent:', {
            to: mailOptions.to,
            subject: mailOptions.subject,
            text: mailOptions.text
          });
        }
        return { messageId: 'dev-' + Date.now() };
      }
    };
  }

  return nodemailer.createTransport({
    host: EMAIL.HOST,
    port: EMAIL.PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: EMAIL.USER,
      pass: EMAIL.PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Email templates
const emailTemplates = {
  welcome: (firstName) => ({
    subject: 'Welcome to Virtual Event Management Platform! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to Virtual Event Platform!</h1>
          <p style="color: #6b7280; font-size: 16px;">Your gateway to amazing virtual events</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #1f2937; margin-bottom: 15px;">Hello ${firstName}! 👋</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
            Thank you for joining our Virtual Event Management Platform! We're excited to have you as part of our community.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            You can now discover and register for exciting virtual events, or create your own if you're an organizer.
          </p>
        </div>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h3 style="color: #1e40af; margin-bottom: 10px;">What's Next?</h3>
          <ul style="color: #1e40af; line-height: 1.8;">
            <li>Explore upcoming events in your area of interest</li>
            <li>Register for events that catch your attention</li>
            <li>Manage your event registrations from your dashboard</li>
            <li>If you're an organizer, start creating amazing events!</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Happy event exploring!<br>
            The Virtual Event Platform Team
          </p>
        </div>
      </div>
    `,
    text: `
      Welcome to Virtual Event Management Platform!
      
      Hello ${firstName}!
      
      Thank you for joining our Virtual Event Management Platform! We're excited to have you as part of our community.
      
      You can now discover and register for exciting virtual events, or create your own if you're an organizer.
      
      What's Next?
      - Explore upcoming events in your area of interest
      - Register for events that catch your attention
      - Manage your event registrations from your dashboard
      - If you're an organizer, start creating amazing events!
      
      Happy event exploring!
      The Virtual Event Platform Team
    `
  }),

  eventRegistration: (firstName, event) => ({
    subject: `Registration Confirmed: ${event.title} 🎫`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin-bottom: 10px;">Registration Confirmed! ✅</h1>
          <p style="color: #6b7280; font-size: 16px;">You're all set for the event</p>
        </div>
        
        <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #1f2937; margin-bottom: 15px;">Hello ${firstName}! 👋</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
            Great news! You've successfully registered for the following event:
          </p>
        </div>
        
        <div style="background-color: #ffffff; border: 2px solid #d1fae5; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #059669; margin-bottom: 15px;">${event.title}</h3>
          <div style="color: #4b5563; line-height: 1.8;">
            <p><strong>📅 Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p><strong>🕒 Time:</strong> ${event.time}</p>
            <p><strong>⏱️ Duration:</strong> ${event.duration} minutes</p>
            <p><strong>📝 Description:</strong> ${event.description}</p>
            ${event.meetingLink ? `<p><strong>🔗 Meeting Link:</strong> <a href="${event.meetingLink}" style="color: #2563eb;">${event.meetingLink}</a></p>` : ''}
          </div>
        </div>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin-bottom: 10px;">Important Reminders:</h3>
          <ul style="color: #92400e; line-height: 1.8;">
            <li>Mark your calendar for the event date and time</li>
            <li>You'll receive a reminder email before the event</li>
            <li>If you have the meeting link, test it beforehand</li>
            <li>Contact the organizer if you have any questions</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Looking forward to seeing you at the event!<br>
            The Virtual Event Platform Team
          </p>
        </div>
      </div>
    `,
    text: `
      Registration Confirmed: ${event.title}
      
      Hello ${firstName}!
      
      Great news! You've successfully registered for the following event:
      
      Event Details:
      - Title: ${event.title}
      - Date: ${new Date(event.date).toLocaleDateString()}
      - Time: ${event.time}
      - Duration: ${event.duration} minutes
      - Description: ${event.description}
      ${event.meetingLink ? `- Meeting Link: ${event.meetingLink}` : ''}
      
      Important Reminders:
      - Mark your calendar for the event date and time
      - You'll receive a reminder email before the event
      - If you have the meeting link, test it beforehand
      - Contact the organizer if you have any questions
      
      Looking forward to seeing you at the event!
      The Virtual Event Platform Team
    `
  }),

  eventUpdate: (firstName, event) => ({
    subject: `Event Updated: ${event.title} 📝`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin-bottom: 10px;">Event Update Notice 📝</h1>
          <p style="color: #6b7280; font-size: 16px;">Important changes to your registered event</p>
        </div>
        
        <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #1f2937; margin-bottom: 15px;">Hello ${firstName}! 👋</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
            The organizer has made updates to an event you're registered for. Please review the updated details below:
          </p>
        </div>
        
        <div style="background-color: #ffffff; border: 2px solid #fecaca; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #dc2626; margin-bottom: 15px;">${event.title}</h3>
          <div style="color: #4b5563; line-height: 1.8;">
            <p><strong>📅 Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p><strong>🕒 Time:</strong> ${event.time}</p>
            <p><strong>⏱️ Duration:</strong> ${event.duration} minutes</p>
            <p><strong>📝 Description:</strong> ${event.description}</p>
            <p><strong>📊 Status:</strong> ${event.status}</p>
            ${event.meetingLink ? `<p><strong>🔗 Meeting Link:</strong> <a href="${event.meetingLink}" style="color: #2563eb;">${event.meetingLink}</a></p>` : ''}
          </div>
        </div>
        
        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h3 style="color: #1e40af; margin-bottom: 10px;">What You Should Do:</h3>
          <ul style="color: #1e40af; line-height: 1.8;">
            <li>Update your calendar with the new event details</li>
            <li>Note any changes to the meeting link or location</li>
            <li>Contact the organizer if you have questions about the changes</li>
            <li>If you can no longer attend, please unregister to free up space</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for staying updated!<br>
            The Virtual Event Platform Team
          </p>
        </div>
      </div>
    `,
    text: `
      Event Update Notice: ${event.title}
      
      Hello ${firstName}!
      
      The organizer has made updates to an event you're registered for. Please review the updated details below:
      
      Updated Event Details:
      - Title: ${event.title}
      - Date: ${new Date(event.date).toLocaleDateString()}
      - Time: ${event.time}
      - Duration: ${event.duration} minutes
      - Description: ${event.description}
      - Status: ${event.status}
      ${event.meetingLink ? `- Meeting Link: ${event.meetingLink}` : ''}
      
      What You Should Do:
      - Update your calendar with the new event details
      - Note any changes to the meeting link or location
      - Contact the organizer if you have questions about the changes
      - If you can no longer attend, please unregister to free up space
      
      Thank you for staying updated!
      The Virtual Event Platform Team
    `
  })
};

// Send welcome email
const sendWelcomeEmail = async (email, firstName) => {
  const transporter = createTransporter();
  const template = emailTemplates.welcome(firstName);

  const mailOptions = {
    from: `"${EMAIL.FROM_NAME}" <${EMAIL.FROM_EMAIL}>`,
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    throw error;
  }
};

// Send event registration confirmation email
const sendEventRegistrationEmail = async (email, firstName, event) => {
  const transporter = createTransporter();
  const template = emailTemplates.eventRegistration(firstName, event);

  const mailOptions = {
    from: `"${EMAIL.FROM_NAME}" <${EMAIL.FROM_EMAIL}>`,
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Registration email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Failed to send registration email:', error);
    throw error;
  }
};

// Send event update notification email
const sendEventUpdateEmail = async (email, firstName, event) => {
  const transporter = createTransporter();
  const template = emailTemplates.eventUpdate(firstName, event);

  const mailOptions = {
    from: `"${EMAIL.FROM_NAME}" <${EMAIL.FROM_EMAIL}>`,
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Event update email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Failed to send event update email:', error);
    throw error;
  }
};

// Send bulk emails (for event reminders, etc.)
const sendBulkEmails = async (emailList, subject, template) => {
  const transporter = createTransporter();
  const results = [];

  for (const emailData of emailList) {
    const mailOptions = {
      from: `"${EMAIL.FROM_NAME}" <${EMAIL.FROM_EMAIL}>`,
      to: emailData.email,
      subject: subject,
      text: template.text(emailData),
      html: template.html(emailData)
    };

    try {
      const result = await transporter.sendMail(mailOptions);
      results.push({ email: emailData.email, success: true, messageId: result.messageId });
      console.log(`✅ Bulk email sent to ${emailData.email}:`, result.messageId);
    } catch (error) {
      results.push({ email: emailData.email, success: false, error: error.message });
      console.error(`❌ Failed to send bulk email to ${emailData.email}:`, error);
    }
  }

  return results;
};

// Test email configuration
const testEmailConfig = async () => {
  const transporter = createTransporter();
  
  if (transporter.sendMail.toString().includes('console.log')) {
    console.log('📧 Email service running in development mode (console logging)');
    return { success: true, mode: 'development' };
  }

  try {
    await transporter.verify();
    console.log('✅ Email server connection verified');
    return { success: true, mode: 'production' };
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendEventRegistrationEmail,
  sendEventUpdateEmail,
  sendBulkEmails,
  testEmailConfig,
  emailTemplates
};
