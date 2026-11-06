# Project implementation rules

- Keep browser image selection and size validation in `src/utils/scanImage.ts`, and server-side AI image validation in the Edge Function-local `image.ts`; separate trust-boundary checks make the server validation independently testable.