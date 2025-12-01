import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicy() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <h2>1. Introduction</h2>
            <p>
              StudyBySelf ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
            </p>

            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Information You Provide</h3>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, exam type, target date, language preference</li>
              <li><strong>Study Preferences:</strong> Daily study hours, preferred time slots, focus session duration</li>
              <li><strong>Profile Information:</strong> Study goals, subjects of interest, timezone</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <ul>
              <li><strong>Study Session Data:</strong> Start/end times, subjects studied, topics covered, session notes</li>
              <li><strong>Focus Mode Data:</strong> Focus duration, break times, applications/websites blocked (when focus mode is active)</li>
              <li><strong>Quiz Performance:</strong> Quiz scores, question responses, time taken, difficulty level</li>
              <li><strong>AI Interactions:</strong> Chat messages, subjects queried, questions asked</li>
              <li><strong>Analytics Data:</strong> Study streaks, XP earned, achievements unlocked, performance metrics</li>
              <li><strong>Device Information:</strong> Device type, operating system, browser type, IP address</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
            </ul>

            <h3>2.3 Focus Mode and App Usage Data</h3>
            <p>
              When you enable focus mode, we may collect:
            </p>
            <ul>
              <li>List of applications and websites you choose to block</li>
              <li>Focus session duration and completion status</li>
              <li>Break patterns and adherence metrics</li>
              <li>Device usage statistics during study sessions (only when focus mode is active)</li>
            </ul>
            <p>
              <strong>Important:</strong> This data is only collected when focus mode is explicitly activated by you. We do not track your device usage outside of study sessions.
            </p>

            <h2>3. How We Use Your Information</h2>
            <p>
              We use collected information for:
            </p>
            <ul>
              <li><strong>Service Delivery:</strong> Providing personalized study plans, generating quizzes, tracking progress</li>
              <li><strong>AI Tutoring:</strong> Answering questions, explaining concepts, generating study materials</li>
              <li><strong>Analytics and Insights:</strong> Analyzing study patterns, identifying weak areas, recommending improvements</li>
              <li><strong>Focus Management:</strong> Enforcing study sessions, blocking distractions, tracking focus time</li>
              <li><strong>Gamification:</strong> Awarding achievements, maintaining streaks, calculating XP</li>
              <li><strong>Communication:</strong> Sending study reminders, achievement notifications, important service updates</li>
              <li><strong>Service Improvement:</strong> Analyzing usage patterns, improving AI responses, enhancing features</li>
              <li><strong>Security:</strong> Detecting abuse, preventing unauthorized access, ensuring service integrity</li>
            </ul>

            <h2>4. Data Sharing and Disclosure</h2>
            
            <h3>4.1 We Share Data With:</h3>
            <ul>
              <li><strong>AI Service Providers:</strong> We use OpenAI/Anthropic Claude for AI tutoring. Chat conversations are sent to these services for processing</li>
              <li><strong>Infrastructure Providers:</strong> Supabase for database and authentication services</li>
              <li><strong>Payment Processors:</strong> Stripe/Razorpay for payment processing (Premium subscriptions)</li>
              <li><strong>Analytics Services:</strong> Aggregated usage analytics for service improvement</li>
            </ul>

            <h3>4.2 We Do NOT:</h3>
            <ul>
              <li>Sell your personal information to third parties</li>
              <li>Share your study data with educational institutions without consent</li>
              <li>Use your data for advertising purposes</li>
              <li>Track your device usage outside of active focus mode sessions</li>
            </ul>

            <h2>5. Data Retention</h2>
            <p>
              We retain your data for different periods depending on the type:
            </p>
            <ul>
              <li><strong>Account Data:</strong> Until account deletion</li>
              <li><strong>Study Sessions:</strong> Indefinitely for progress tracking (deletable by user)</li>
              <li><strong>Quiz Results:</strong> Indefinitely for analytics (deletable by user)</li>
              <li><strong>AI Chat Conversations:</strong> 90 days for quality improvement, then deleted</li>
              <li><strong>Analytics Data:</strong> Aggregated indefinitely, personally identifiable data deleted with account</li>
              <li><strong>Logs and Security Data:</strong> 90 days</li>
            </ul>

            <h2>6. Your Rights and Choices</h2>
            
            <h3>6.1 Access and Control</h3>
            <p>
              You have the right to:
            </p>
            <ul>
              <li><strong>Access:</strong> View all your stored data through the profile page</li>
              <li><strong>Export:</strong> Download all your data in JSON format</li>
              <li><strong>Delete:</strong> Request deletion of specific data or your entire account</li>
              <li><strong>Modify:</strong> Update your profile, preferences, and study goals</li>
              <li><strong>Opt-out:</strong> Disable notifications and adjust privacy settings</li>
            </ul>

            <h3>6.2 Focus Mode Permissions</h3>
            <p>
              You can:
            </p>
            <ul>
              <li>Enable or disable focus mode at any time</li>
              <li>Customize which apps/websites are blocked</li>
              <li>Revoke app usage permissions through device settings</li>
              <li>View what data is collected during focus sessions</li>
            </ul>

            <h2>7. Data Security</h2>
            <p>
              We implement security measures including:
            </p>
            <ul>
              <li><strong>Encryption:</strong> All data transmitted via HTTPS/TLS</li>
              <li><strong>Authentication:</strong> Secure password hashing and JWT tokens</li>
              <li><strong>Access Control:</strong> Row-level security policies in database</li>
              <li><strong>Regular Audits:</strong> Security assessments and vulnerability scans</li>
              <li><strong>Backup:</strong> Regular encrypted backups of user data</li>
            </ul>

            <h2>8. Children's Privacy</h2>
            <p>
              Our Service is intended for users aged 16 and above. We do not knowingly collect information from children under 16. If you believe we have collected such information, please contact us immediately.
            </p>

            <h2>9. International Data Transfers</h2>
            <p>
              Your data may be processed in countries outside India, including:
            </p>
            <ul>
              <li>United States (AI processing via OpenAI/Claude)</li>
              <li>European Union (Supabase infrastructure)</li>
            </ul>
            <p>
              We ensure appropriate safeguards are in place for international data transfers.
            </p>

            <h2>10. Cookies and Tracking</h2>
            <p>
              We use the following types of cookies:
            </p>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
              <li><strong>Functional Cookies:</strong> Remember preferences and settings</li>
              <li><strong>Analytics Cookies:</strong> Understand usage patterns (can be disabled)</li>
            </ul>
            <p>
              We do not use advertising or tracking cookies. You can manage cookie preferences in your browser settings.
            </p>

            <h2>11. Data Protection Rights (India)</h2>
            <p>
              Under Indian data protection laws, you have rights including:
            </p>
            <ul>
              <li>Right to information about data processing</li>
              <li>Right to access and obtain copies of your data</li>
              <li>Right to correction of inaccurate data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
            </ul>

            <h2>12. Changes to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant changes via:
            </p>
            <ul>
              <li>Email notification</li>
              <li>In-app notification</li>
              <li>Prominent notice on our website</li>
            </ul>
            <p>
              Continued use of the Service after changes constitutes acceptance of the updated Privacy Policy.
            </p>

            <h2>13. Contact Us</h2>
            <p>
              For privacy-related questions, concerns, or requests, contact us at:
            </p>
            <ul>
              <li><strong>Email:</strong> privacy@studybyself.com</li>
              <li><strong>Data Protection Officer:</strong> dpo@studybyself.com</li>
              <li><strong>Response Time:</strong> Within 30 days of receipt</li>
            </ul>

            <h2>14. Data Breach Notification</h2>
            <p>
              In the event of a data breach that may affect your personal information, we will notify you within 72 hours via email and in-app notification, including:
            </p>
            <ul>
              <li>Nature of the breach</li>
              <li>Data potentially affected</li>
              <li>Steps taken to address the breach</li>
              <li>Recommended actions for users</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
