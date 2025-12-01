import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CookiePolicy() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Cookie Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <h2>1. What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, maintain your login session, and understand how you use the service.
            </p>

            <h2>2. How We Use Cookies</h2>
            <p>
              StudyBySelf uses cookies and similar technologies for essential functionality and to improve your experience. We use minimal cookies and do not track you across other websites.
            </p>

            <h2>3. Types of Cookies We Use</h2>

            <h3>3.1 Essential Cookies (Always Active)</h3>
            <p>
              These cookies are necessary for the Service to function and cannot be disabled:
            </p>
            <ul>
              <li><strong>Authentication Cookies:</strong> Keep you logged in securely (supabase.auth.token)</li>
              <li><strong>Session Cookies:</strong> Maintain your session state during use</li>
              <li><strong>Security Cookies:</strong> Prevent unauthorized access and fraud</li>
            </ul>
            <p>
              <strong>Storage Duration:</strong> Session-based or until you log out
            </p>

            <h3>3.2 Functional Cookies (Optional)</h3>
            <p>
              These cookies remember your choices and preferences:
            </p>
            <ul>
              <li><strong>Language Preference:</strong> Remember your selected language (en/hi)</li>
              <li><strong>Theme Preference:</strong> Remember dark mode setting</li>
              <li><strong>Quiz Auto-save:</strong> Temporarily store quiz answers to prevent data loss</li>
              <li><strong>Notification Preferences:</strong> Remember your notification settings</li>
            </ul>
            <p>
              <strong>Storage Duration:</strong> Up to 1 year or until cleared by you
            </p>

            <h3>3.3 Analytics Cookies (Optional - Can Be Disabled)</h3>
            <p>
              These cookies help us understand how the Service is used:
            </p>
            <ul>
              <li><strong>Usage Analytics:</strong> Track which features are most used</li>
              <li><strong>Performance Monitoring:</strong> Identify slow-loading pages</li>
              <li><strong>Error Tracking:</strong> Detect and fix technical issues</li>
            </ul>
            <p>
              <strong>Note:</strong> Analytics data is aggregated and anonymized. We do not use third-party analytics services like Google Analytics.
              <br />
              <strong>Storage Duration:</strong> Up to 90 days
            </p>

            <h2>4. Cookies We Do NOT Use</h2>
            <p>
              StudyBySelf explicitly does NOT use:
            </p>
            <ul>
              <li><strong>Advertising Cookies:</strong> We don't show ads or track you for advertising</li>
              <li><strong>Third-party Tracking:</strong> No Google Analytics, Facebook Pixel, or similar</li>
              <li><strong>Cross-site Tracking:</strong> We don't track your activity on other websites</li>
              <li><strong>Social Media Cookies:</strong> No Facebook, Twitter, or LinkedIn tracking</li>
            </ul>

            <h2>5. Local Storage and Session Storage</h2>
            <p>
              In addition to cookies, we use browser storage mechanisms:
            </p>

            <h3>5.1 Local Storage</h3>
            <ul>
              <li><strong>Authentication State:</strong> Supabase session management</li>
              <li><strong>User Preferences:</strong> Theme, language, notification settings</li>
              <li><strong>Quiz Progress:</strong> Auto-save quiz answers to prevent data loss</li>
            </ul>

            <h3>5.2 Session Storage</h3>
            <ul>
              <li><strong>Temporary State:</strong> Active focus session data</li>
              <li><strong>Navigation State:</strong> Current page state and form inputs</li>
            </ul>
            <p>
              <strong>Note:</strong> Session storage is cleared when you close the browser tab.
            </p>

            <h2>6. Managing Cookies</h2>

            <h3>6.1 Browser Settings</h3>
            <p>
              You can manage cookies through your browser settings:
            </p>
            <ul>
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
              <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
              <li><strong>Edge:</strong> Settings → Privacy → Cookies</li>
            </ul>

            <h3>6.2 In-App Cookie Preferences</h3>
            <p>
              You can manage optional cookies in your account settings:
            </p>
            <ul>
              <li>Go to Settings → Privacy & Security</li>
              <li>Toggle "Analytics Cookies" on/off</li>
              <li>Your preference is saved and applied immediately</li>
            </ul>

            <h3>6.3 Impact of Disabling Cookies</h3>
            <p>
              Disabling different types of cookies has different effects:
            </p>
            <ul>
              <li><strong>Essential Cookies:</strong> Service will not function (you cannot disable these)</li>
              <li><strong>Functional Cookies:</strong> Preferences will not be saved, need to re-select each visit</li>
              <li><strong>Analytics Cookies:</strong> No impact on functionality, we just won't collect usage data</li>
            </ul>

            <h2>7. Third-Party Services and Their Cookies</h2>

            <h3>7.1 Supabase (Authentication & Database)</h3>
            <ul>
              <li><strong>Purpose:</strong> User authentication and session management</li>
              <li><strong>Cookies:</strong> supabase.auth.token, supabase.auth.refresh_token</li>
              <li><strong>Privacy Policy:</strong> <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">https://supabase.com/privacy</a></li>
            </ul>

            <h3>7.2 Stripe/Razorpay (Payment Processing)</h3>
            <ul>
              <li><strong>Purpose:</strong> Secure payment processing for Premium subscriptions</li>
              <li><strong>Cookies:</strong> Set by payment provider during checkout</li>
              <li><strong>Privacy:</strong> Governed by respective payment provider's privacy policy</li>
            </ul>

            <h3>7.3 OpenAI/Claude (AI Services)</h3>
            <ul>
              <li><strong>Purpose:</strong> AI tutoring and content generation</li>
              <li><strong>Cookies:</strong> None (API-based, no direct browser interaction)</li>
              <li><strong>Data:</strong> Chat messages sent to AI provider for processing</li>
            </ul>

            <h2>8. Mobile App Data Storage</h2>
            <p>
              If you use StudyBySelf as a Progressive Web App (PWA) or installed app:
            </p>
            <ul>
              <li><strong>App Cache:</strong> Stores app files for offline functionality</li>
              <li><strong>IndexedDB:</strong> Stores structured data for offline access</li>
              <li><strong>Service Workers:</strong> Enable background sync and push notifications</li>
            </ul>
            <p>
              You can clear this data through your browser/device settings → Site Storage → StudyBySelf
            </p>

            <h2>9. Focus Mode and Permission-Based Data</h2>
            <p>
              Focus mode requires additional permissions that are separate from cookies:
            </p>
            <ul>
              <li><strong>App Usage Permission:</strong> Required to block apps during focus mode</li>
              <li><strong>Notification Permission:</strong> For study reminders and break alerts</li>
              <li><strong>Do Not Disturb Access:</strong> To silence notifications during focus</li>
            </ul>
            <p>
              These permissions can be revoked through your device settings without affecting cookie preferences.
            </p>

            <h2>10. Cookie Retention and Deletion</h2>

            <h3>10.1 Automatic Deletion</h3>
            <ul>
              <li><strong>Session Cookies:</strong> Deleted when you close the browser</li>
              <li><strong>Short-term Cookies:</strong> Deleted after 24 hours</li>
              <li><strong>Long-term Cookies:</strong> Deleted after 1 year</li>
            </ul>

            <h3>10.2 Manual Deletion</h3>
            <p>
              You can delete cookies at any time:
            </p>
            <ul>
              <li><strong>Browser Clear Data:</strong> Settings → Clear browsing data → Cookies</li>
              <li><strong>Account Settings:</strong> Settings → Privacy → Clear Cookies</li>
              <li><strong>Sign Out:</strong> Clears authentication cookies automatically</li>
            </ul>

            <h2>11. Cookie Updates and Notifications</h2>
            <p>
              We may add new cookies or modify existing ones as we improve the Service. Significant changes will be communicated via:
            </p>
            <ul>
              <li>Email notification to registered users</li>
              <li>Banner notification on the website</li>
              <li>Updated Cookie Policy (with revision date)</li>
            </ul>

            <h2>12. Children's Privacy and Cookies</h2>
            <p>
              Our Service is intended for users aged 16+. We do not knowingly collect cookies or data from children under 16. If you believe a child has provided information, contact us immediately.
            </p>

            <h2>13. Cookie Consent</h2>
            <p>
              By using StudyBySelf, you consent to:
            </p>
            <ul>
              <li>Use of essential cookies (required for service functionality)</li>
              <li>Optional use of functional and analytics cookies (can be disabled)</li>
              <li>Storage of data in local/session storage for functionality</li>
            </ul>
            <p>
              You can withdraw consent for optional cookies at any time in Settings.
            </p>

            <h2>14. Contact Us About Cookies</h2>
            <p>
              For questions about our cookie usage:
            </p>
            <ul>
              <li><strong>Email:</strong> privacy@studybyself.com</li>
              <li><strong>Subject:</strong> "Cookie Policy Inquiry"</li>
              <li><strong>Response Time:</strong> Within 7 days</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
