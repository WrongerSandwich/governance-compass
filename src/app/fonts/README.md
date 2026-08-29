# Vendored fonts

`SourceSerif4-latin-variable.woff2` and `SourceSerif4-latin-variable-italic.woff2`
are the latin-subset variable cuts of [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4),
covering the 400–500 weight range the design system uses.

They are checked in and loaded through `next/font/local` in `src/app/layout.tsx`
so builds never reach the network. Regenerate by re-downloading the `latin`
`@font-face` sources from the Google Fonts CSS API.

Licensed under the [SIL Open Font License 1.1](https://openfontlicense.org/).
Copyright 2014–2023 Adobe (http://www.adobe.com/), with Reserved Font Name
'Source'.
