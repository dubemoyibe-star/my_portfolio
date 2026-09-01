/**
 * The hash to scroll to if `href` points at a section of the page currently
 * open, or `null` if following it means leaving this page.
 *
 * Section links are stored root-relative (`/#projects`) rather than as bare
 * fragments (`#projects`). A bare fragment resolves against whatever route the
 * reader is on, so from `/cv` it becomes `/cv#projects` — an anchor that does
 * not exist there, and the click silently does nothing.
 *
 * Root-relative links fix that on their own: the browser treats `/#projects`
 * as a same-document jump when already on `/`, and as a normal navigation from
 * anywhere else. This helper exists only so the mobile panel can tell those
 * two cases apart, because the first needs its scroll deferred past the
 * panel's scroll lock and the second does not.
 */
export function sameDocumentHash(href: string, pathname: string): string | null {
  const index = href.indexOf("#");
  if (index === -1) return null;

  /* A bare fragment is same-document by definition, whatever the route — that
     is precisely why bare fragments were wrong for section links, and equally
     why they are right for something like the skip link. */
  if (index === 0) return href;

  return href.slice(0, index) === pathname ? href.slice(index) : null;
}
