import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfService() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using StudyBySelf ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              StudyBySelf is an AI-powered study companion platform designed for UPSC and State PSC exam preparation. The Service provides:
            </p>
            <ul>
              <li>AI-powered tutoring across multiple subjects</li>
              <li>Study session management and focus tracking</li>
              <li>Quiz generation and performance analytics</li>
              <li>Personalized study timetables</li>
              <li>Progress tracking and gamification features</li>
            </ul>

            <h2>3. User Accounts</h2>
            <p>
              To access certain features of the Service, you must create an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your password and account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Be responsible for all activities that occur under your account</li>
            </ul>

            <h2>4. Subscription and Payments</h2>
            <h3>4.1 Free Tier</h3>
            <p>
              The Free tier provides limited access to Service features, including daily AI request limits and basic analytics.
            </p>

            <h3>4.2 Premium Subscription</h3>
            <p>
              The Premium subscription (₹299/month) provides unlimited access to all features. Premium subscriptions:
            </p>
            <ul>
              <li>Automatically renew monthly unless canceled</li>
              <li>Can be canceled at any time through your account settings</li>
              <li>Are billed in advance on a monthly basis</li>
              <li>Do not provide refunds for partial months</li>
            </ul>

            <h2>5. Acceptable Use</h2>
            <p>
              You agree not to:
            </p>
            <ul>
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Abuse or excessively use AI features in a manner that degrades service quality for others</li>
              <li>Share your account credentials with others</li>
              <li>Use automated means to access the Service without permission</li>
              <li>Reverse engineer or attempt to extract source code from the Service</li>
            </ul>

            <h2>6. AI-Generated Content</h2>
            <p>
              StudyBySelf uses artificial intelligence to generate educational content. You acknowledge that:
            </p>
            <ul>
              <li>AI-generated content may contain errors or inaccuracies</li>
              <li>AI responses should be verified against authoritative sources</li>
              <li>The Service provides AI-generated content "as is" without guarantees of accuracy</li>
              <li>You should not rely solely on AI-generated content for exam preparation</li>
              <li>All AI-generated quiz questions and study materials are for educational purposes only</li>
            </ul>

            <h2>7. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by StudyBySelf and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h2>8. User Data and Privacy</h2>
            <p>
              Your use of the Service is also governed by our Privacy Policy. We collect and process data including:
            </p>
            <ul>
              <li>Study session data and focus time tracking</li>
              <li>Quiz performance and analytics</li>
              <li>AI chat conversations for service improvement</li>
              <li>Account information and preferences</li>
            </ul>

            <h2>9. Focus Mode and Device Access</h2>
            <p>
              The focus mode feature may request permissions to:
            </p>
            <ul>
              <li>Block certain applications and websites during study sessions</li>
              <li>Track app usage for focus time calculations</li>
              <li>Send notifications and reminders</li>
            </ul>
            <p>
              You can revoke these permissions at any time through your device settings, though this may affect the functionality of focus mode features.
            </p>

            <h2>10. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will immediately cease.
            </p>

            <h2>11. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>

            <h2>12. Limitation of Liability</h2>
            <p>
              IN NO EVENT SHALL STUDYBYSELF BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
            </p>

            <h2>13. Governing Law</h2>
            <p>
              These Terms shall be governed by the laws of India. Any disputes arising from these Terms or use of the Service shall be subject to the exclusive jurisdiction of courts in [Your City], India.
            </p>

            <h2>14. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>

            <h2>15. Contact Information</h2>
            <p>
              For questions about these Terms, please contact us at:
              <br />
              Email: support@studybyself.com
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
