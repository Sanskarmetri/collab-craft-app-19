# Scan & Learn for AI Tutor

Add an image-scanning action to the existing AI Tutor chat so learners can photograph or select study material and receive an explanation limited to UPSC relevance.

## User experience
- Add a camera/photo control beside the chat composer; support taking a photo on mobile or selecting an image.
- Accept JPEG, PNG, and WebP images up to 5 MB. Show the selected filename and allow removal; send either a text prompt with the image or a sensible UPSC explanation prompt when the text box is empty.
- Keep image data only in memory for the request; do not save it to chat history or browser storage.
- Preserve the existing subject and language selection, authentication, and SSE streaming behavior.

## Implementation
- Extend `src/pages/Chat.tsx` with the image picker, attachment state, and scan/send interaction.
- Extend `src/utils/streamChat.ts` with an optional image payload while preserving the current authenticated request and stream parser.
- Update only `supabase/functions/ai-chat/index.ts` to validate the optional image data URL and size, attach it to the latest user message using the existing Chat Completions image format, and add a conditional UPSC-relevance instruction for image requests. Keep authentication, rate limits, prompts for text-only chat, and streaming response behavior intact.
- Add focused tests for image validation and request forwarding; do not persist or log image data.

## Verification
- Run focused and existing tests, type checks, and inspect the latest build diagnostic.
- Exercise image selection and request flow in the preview where possible; verify auth and SSE paths remain unchanged. A live vision response may depend on available backend and AI credits.

## Technical details
- The Edge Function remains the authenticated, server-side Lovable AI Gateway boundary; no new service, database change, or storage bucket is introduced.
- Image requests use a MIME-specific `data:` URL in a Chat Completions `image_url` content part; text-only request bodies remain unchanged.
