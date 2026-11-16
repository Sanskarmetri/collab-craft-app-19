import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { getBearerToken } from "./auth.ts";

Deno.test('extracts a JWT from a Bearer authorization header', () => {
  assertEquals(getBearerToken('Bearer header.payload.signature'), 'header.payload.signature');
});

Deno.test('rejects a missing authorization header', () => {
  assertEquals(getBearerToken(null), null);
});

Deno.test('rejects malformed authorization headers', () => {
  assertEquals(getBearerToken('Basic header.payload.signature'), null);
  assertEquals(getBearerToken('Bearer'), null);
  assertEquals(getBearerToken('Bearer token extra'), null);
});