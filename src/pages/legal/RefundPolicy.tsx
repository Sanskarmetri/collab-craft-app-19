import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RefundPolicy() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Refund Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <h2>1. Overview</h2>
            <p>
              At StudyBySelf, we strive to provide the best possible service to our users. This Refund Policy outlines the circumstances under which refunds may be issued for Premium subscriptions.
            </p>

            <h2>2. Free Tier</h2>
            <p>
              The Free tier of StudyBySelf does not involve any payment and therefore no refunds are applicable. Users can access free features indefinitely without any charges.
            </p>

            <h2>3. Premium Subscription Refunds</h2>

            <h3>3.1 7-Day Money-Back Guarantee</h3>
            <p>
              We offer a 7-day money-back guarantee for first-time Premium subscribers:
            </p>
            <ul>
              <li><strong>Eligibility:</strong> First-time Premium subscribers only</li>
              <li><strong>Timeframe:</strong> Request within 7 days of initial subscription</li>
              <li><strong>Refund Amount:</strong> Full refund of the first month's subscription fee (₹299)</li>
              <li><strong>Process:</strong> Email support@studybyself.com with your account email and reason</li>
              <li><strong>Timeline:</strong> Refunds processed within 5-7 business days</li>
            </ul>

            <h3>3.2 Renewal Subscriptions</h3>
            <p>
              Subscription renewals (after the first month) are generally non-refundable. However, we may consider refund requests in exceptional circumstances:
            </p>
            <ul>
              <li><strong>Billing Errors:</strong> If you were charged incorrectly due to a system error</li>
              <li><strong>Technical Issues:</strong> If the Service was unavailable for an extended period</li>
              <li><strong>Duplicate Charges:</strong> If you were charged multiple times in error</li>
            </ul>
            <p>
              <strong>Important:</strong> We do not provide refunds for:
            </p>
            <ul>
              <li>Partial months of service</li>
              <li>Unused subscription time after cancellation</li>
              <li>Subscriptions canceled during the billing cycle</li>
              <li>Change of mind after the 7-day guarantee period</li>
            </ul>

            <h2>4. How to Cancel Your Subscription</h2>
            <p>
              You can cancel your Premium subscription at any time:
            </p>
            <ol>
              <li>Log in to your StudyBySelf account</li>
              <li>Navigate to Settings → Subscription</li>
              <li>Click "Manage Subscription"</li>
              <li>Select "Cancel Subscription" in the Stripe Customer Portal</li>
            </ol>
            <p>
              <strong>Effects of Cancellation:</strong>
            </p>
            <ul>
              <li>Your subscription will remain active until the end of the current billing period</li>
              <li>You will continue to have Premium access until the subscription expires</li>
              <li>No further charges will be made</li>
              <li>After expiration, your account will revert to the Free tier</li>
              <li>Your study data, progress, and history will be preserved</li>
            </ul>

            <h2>5. Requesting a Refund</h2>

            <h3>5.1 Eligible Refund Requests</h3>
            <p>
              To request a refund, email us at support@studybyself.com with:
            </p>
            <ul>
              <li>Subject line: "Refund Request - [Your Email]"</li>
              <li>Your registered email address</li>
              <li>Transaction ID or payment receipt</li>
              <li>Reason for refund request</li>
              <li>Date of subscription purchase</li>
            </ul>

            <h3>5.2 Refund Processing</h3>
            <p>
              Once approved:
            </p>
            <ul>
              <li><strong>Processing Time:</strong> 5-7 business days</li>
              <li><strong>Refund Method:</strong> Original payment method (credit card, UPI, etc.)</li>
              <li><strong>Bank Processing:</strong> Additional 5-10 business days depending on your bank</li>
              <li><strong>Notification:</strong> Email confirmation when refund is processed</li>
            </ul>

            <h2>6. Special Circumstances</h2>

            <h3>6.1 Service Disruptions</h3>
            <p>
              If StudyBySelf experiences significant service disruptions (&gt;24 hours) affecting Premium features:
            </p>
            <ul>
              <li>We will automatically extend your subscription by the equivalent downtime</li>
              <li>Pro-rated refunds may be issued for extended outages (&gt;48 hours)</li>
              <li>Users will be notified via email of any compensatory measures</li>
            </ul>

            <h3>6.2 Technical Issues Preventing Usage</h3>
            <p>
              If you experience persistent technical issues that prevent you from using Premium features:
            </p>
            <ul>
              <li>Contact our support team at support@studybyself.com</li>
              <li>We will work to resolve the issue within 48 hours</li>
              <li>If unresolved after 7 days, a pro-rated refund may be issued</li>
            </ul>

            <h3>6.3 Fraudulent Transactions</h3>
            <p>
              If you notice an unauthorized charge on your account:
            </p>
            <ul>
              <li>Contact us immediately at support@studybyself.com</li>
              <li>Change your password immediately</li>
              <li>We will investigate and issue a full refund if fraud is confirmed</li>
              <li>You may also contact your bank/card issuer to dispute the charge</li>
            </ul>

            <h2>7. Non-Refundable Scenarios</h2>
            <p>
              Refunds will NOT be issued in the following cases:
            </p>
            <ul>
              <li><strong>Change of Mind:</strong> After the 7-day guarantee period</li>
              <li><strong>Exam Completion:</strong> If you passed your exam and no longer need the service</li>
              <li><strong>Insufficient Usage:</strong> "I didn't use it much" is not grounds for refund</li>
              <li><strong>Third-party Issues:</strong> Internet connectivity, device compatibility (if not caused by our service)</li>
              <li><strong>Violation of Terms:</strong> If your account was suspended for terms violation</li>
              <li><strong>Subscription Sharing:</strong> If account sharing was detected</li>
              <li><strong>AI Response Quality:</strong> Subjective disagreement with AI-generated content (we continuously improve AI quality)</li>
            </ul>

            <h2>8. Payment Provider Policies</h2>
            <p>
              Our payment processing is handled by Stripe/Razorpay. Their refund policies also apply:
            </p>
            <ul>
              <li>Refunds are subject to payment provider processing times</li>
              <li>Certain payment methods may have longer refund timelines</li>
              <li>Payment provider fees may not be refundable in some cases</li>
              <li>International transactions may incur currency conversion fees</li>
            </ul>

            <h2>9. Subscription Modifications</h2>

            <h3>9.1 Upgrading/Downgrading</h3>
            <p>
              Currently, StudyBySelf offers two tiers: Free and Premium (₹299/month)
            </p>
            <ul>
              <li><strong>Upgrading to Premium:</strong> Takes effect immediately upon payment</li>
              <li><strong>Downgrading to Free:</strong> Takes effect at the end of the current billing period</li>
              <li><strong>No Refunds:</strong> For time remaining when downgrading</li>
            </ul>

            <h2>10. Promotional Offers and Discounts</h2>
            <p>
              If you subscribed using a promotional code or discount:
            </p>
            <ul>
              <li>The 7-day money-back guarantee still applies</li>
              <li>Refund will be for the discounted amount actually paid</li>
              <li>Promotional codes are non-transferable and cannot be refunded separately</li>
            </ul>

            <h2>11. Fair Usage Policy</h2>
            <p>
              We reserve the right to deny refund requests that appear to abuse our policies:
            </p>
            <ul>
              <li>Multiple refund requests from the same user</li>
              <li>Patterns suggesting subscription cycling for free access</li>
              <li>Requesting refunds after extracting substantial value from the service</li>
            </ul>

            <h2>12. Dispute Resolution</h2>
            <p>
              If your refund request is denied and you disagree:
            </p>
            <ol>
              <li>Request a review by emailing escalation@studybyself.com</li>
              <li>Provide additional documentation supporting your case</li>
              <li>We will respond within 3 business days with a final decision</li>
              <li>If still unsatisfied, you may pursue alternative dispute resolution</li>
            </ol>

            <h2>13. Chargebacks</h2>
            <p>
              <strong>Important:</strong> Please contact us before initiating a chargeback with your bank:
            </p>
            <ul>
              <li>We can often resolve issues faster than the chargeback process</li>
              <li>Chargebacks may result in account suspension</li>
              <li>Multiple chargebacks may result in permanent account closure</li>
              <li>We may dispute invalid chargebacks</li>
            </ul>

            <h2>14. Changes to Refund Policy</h2>
            <p>
              We may update this Refund Policy periodically. Changes will be:
            </p>
            <ul>
              <li>Posted on this page with an updated "Last modified" date</li>
              <li>Communicated via email for significant changes</li>
              <li>Effective immediately for new subscriptions</li>
              <li>Applied to existing subscriptions at next renewal</li>
            </ul>

            <h2>15. Contact Information</h2>
            <p>
              For refund requests or questions about this policy:
            </p>
            <ul>
              <li><strong>Email:</strong> support@studybyself.com</li>
              <li><strong>Subject:</strong> "Refund Request" or "Refund Policy Question"</li>
              <li><strong>Response Time:</strong> Within 24-48 hours</li>
              <li><strong>Escalations:</strong> escalation@studybyself.com</li>
            </ul>

            <h2>16. Governing Law</h2>
            <p>
              This Refund Policy is governed by the laws of India. Any disputes regarding refunds shall be subject to the exclusive jurisdiction of courts in [Your City], India.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
