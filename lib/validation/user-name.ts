/**
 * Display-name rule shared by the create + edit user forms and the MSW mock.
 * Unicode letters (so Vietnamese diacritics like ễ ă ị ư work) + combining
 * marks + spaces only — no digits, no symbols. `\p{M}` covers decomposed
 * diacritics; the `u` flag is required for `\p{...}`. Mirrors the BE
 * `NAME_REGEX` in `feat-helpdesk-api/src/routes/users.ts`.
 */
export const NAME_REGEX = /^[\p{L}\p{M}\s]+$/u;
export const NAME_ERROR = 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
