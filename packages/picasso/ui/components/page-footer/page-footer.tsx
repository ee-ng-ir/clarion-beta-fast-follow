// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";

import { cn } from "../../lib/utils";

/**
 * PageFooter — the actions that finish a page, under a rule at the end of it.
 * PageHeader's other end: the page's name above, the page between, what to do
 * about it below.
 *
 * Figma: none yet. Code first, measured off the Ops Console provisioning
 * portal's two form pages — the pattern already shipping in an IR product.
 * In both, the rule spans the form and the buttons sit flush to its end edge,
 * ~24 under it, with the primary last. The rule's width is the thing that
 * matters: right-aligning to the *page* rather than the form would put the
 * submit 1500px from the last field on a 2560 monitor. It is right-aligned to
 * the column, and on a form page the column is capped — `width="reading"` —
 * so the travel from the last field is bounded at 768.
 *
 * `justify-end` is the inline end, so this is Cancel-then-Confirm in LTR and
 * the mirror of it in RTL, with no `rtl:` of its own.
 *
 * `gap-3` and the rule come from DrawerFooter, which is the same job in a
 * panel: a form the person completes and submits. DialogFooter uses `gap-2`
 * because a confirmation's two buttons are short. A page form is Drawer's
 * shape, not Dialog's.
 *
 * Ordering is the content's, but the house rule from 29 Sept applies: the
 * primary goes last, at the inline end, paired with the secondary or the
 * outline — never a ghost.
 *
 * It does not stick. A form long enough for its own actions to be three
 * screens away is a form that wants splitting or a sticky bar, and neither is
 * built; nothing here pretends otherwise.
 */
export function PageFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-footer"
      // pt-gutter, not a number: 16 below xl and 24 from 1280 up, the same
      // step as the page padding it sits inside.
      className={cn(
        "flex flex-wrap items-center justify-end gap-3 border-t " +
          "border-line-neutral-muted pt-gutter",
        className,
      )}
      {...props}
    />
  );
}
