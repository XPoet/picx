# Changelog

All notable changes of PicX are documented in this file.

## [3.2.1](https://github.com/XPoet/picx/compare/v3.2.0...v3.2.1) (2026-10-23)

### 🎨 Styles

* **deployment:** improve Pages status and deployment controls ([484da90](https://github.com/XPoet/picx/commit/484da90b14ab3da44115ec923161142eb625b0f7))

## [3.2.0](https://github.com/XPoet/picx/compare/v3.1.2...v3.2.0) (2026-10-21)

### ✨ Features

* **api:** add typed safe request results and directory queries ([b798bec](https://github.com/XPoet/picx/commit/b798bec4bfa010d1f4bcad9051d5cdae7120b7da))
* **auth:** extract reentrant GitHub connection and initialization ([67a6132](https://github.com/XPoet/picx/commit/67a6132f04cb4d5f2fe89de113a8c91b23036668))
* **auth:** merge legacy configuration routes into connection and upload ([7903154](https://github.com/XPoet/picx/commit/79031549fa643fc506394f2eaa520441d8429690))
* **components:** add an external link to the image processing platform ([f91eff1](https://github.com/XPoet/picx/commit/f91eff14a55854f58cdd244e24c8c50f3ed97792))
* **deploy:** share entry guards and deployment shortcut ([8f37883](https://github.com/XPoet/picx/commit/8f37883469071291eee095fbf80fc8e60f97399c))
* **management:** add directory navigation and targeted uploads ([c4e8dd7](https://github.com/XPoet/picx/commit/c4e8dd7398eee9d9207314087d83702d5cf98f5f))
* **management:** expose accessible media card actions ([5161068](https://github.com/XPoet/picx/commit/516106849c59d8546e28c1097741ad0a55eae798))
* **management:** filter and partition directory contents ([dc43bf0](https://github.com/XPoet/picx/commit/dc43bf08c2a47dc14135cf4f456f6bbedb6ae168))
* **management:** recover directory and media operations ([755076c](https://github.com/XPoet/picx/commit/755076c7dd5376c7559453841e59fb5b9fd29eca))
* **management:** scope batch selection to visible media ([026a897](https://github.com/XPoet/picx/commit/026a8978fe78c9fe33b1d6fb07e3ba44779d7c40))
* **settings:** preserve and validate upload preferences ([e6e2501](https://github.com/XPoet/picx/commit/e6e25018020ee0c4f50dd07c487c950a3ac74644))
* **settings:** save domains and deploy with CNAME safeguards ([80aafc5](https://github.com/XPoet/picx/commit/80aafc5770d74eceb63bbe061c5462e94a54d007))
* **settings:** split preferences into three browsable sections ([e28cb76](https://github.com/XPoet/picx/commit/e28cb76b269df8010bf3a47cdcee33ede15fc7f5))
* **settings:** validate link rules and Pages source selection ([3fca33d](https://github.com/XPoet/picx/commit/3fca33d204318529a50241e82e9535245d9e39e4))
* **ui:** add OAuth and Token connection cards ([b1e160a](https://github.com/XPoet/picx/commit/b1e160a4c556c76199badac35b6afe7e59fc8fe0))
* **ui:** add original brand vectors and local Lucide icons ([e18e82b](https://github.com/XPoet/picx/commit/e18e82b62841ee1b4fda02e19ba8fcc40e0615b5))
* **ui:** add responsive footer and reachable feedback links ([18d9525](https://github.com/XPoet/picx/commit/18d95253c9f96eca6775fb6e0fbee7b1009640e0))
* **ui:** establish semantic theme tokens and Element Plus bridge ([3ebed4b](https://github.com/XPoet/picx/commit/3ebed4b12510d1282e1f386f33f7e64eea74f850))
* **ui:** integrate account preferences announcements and install tools ([9038dfc](https://github.com/XPoet/picx/commit/9038dfc5dc0d37cbe9be98bb56be88158dbcc79d))
* **ui:** introduce capsule header and keyboard accessible navigation ([1374708](https://github.com/XPoet/picx/commit/137470862a6845992ad36fa86aac1e57caeabb02))
* **ui:** show verified repository context and recovery states ([c4505af](https://github.com/XPoet/picx/commit/c4505af07191a34ed5d8f86baa5bdc3524f41bbf))
* **ui:** unify document scrolling and responsive shell layouts ([d1a20a2](https://github.com/XPoet/picx/commit/d1a20a2f47fc0445029dc069f041bfc0466f5cb8))
* **upload:** add controlled repository directory browsing ([9070836](https://github.com/XPoet/picx/commit/9070836262981a2f203b092c230c921873cfd5e8))
* **upload:** add persistent file intake and local design icons ([2fea915](https://github.com/XPoet/picx/commit/2fea915323bfbd0581e7f9159b87a6fca8038f97))
* **upload:** add shared quick settings and responsive workspace ([273ac91](https://github.com/XPoet/picx/commit/273ac91ae38d243dca2b4aa988e7b2060ec1d396))
* **upload:** add validated directory drafts and atomic persistence ([a13fa04](https://github.com/XPoet/picx/commit/a13fa04b2f4006a1004a19a94a3b2c9f416dfb86))
* **upload:** integrate transactional directory dialog and shared entries ([669f405](https://github.com/XPoet/picx/commit/669f405d8a4af9a127c3121590de1c3f2a141dff))
* **upload:** render lightweight media queue with explicit details ([0b44d1f](https://github.com/XPoet/picx/commit/0b44d1ff68aa1cf79e4ccfcaa26927d267334913))
* **upload:** retain batch results and support recovery workflows ([6613f6b](https://github.com/XPoet/picx/commit/6613f6b6343416c81f1d811e6ed21103821a7969))

### 🐞 Bug Fixes

* **a11y:** improve success contrast and add acceptance coverage ([6e7c35b](https://github.com/XPoet/picx/commit/6e7c35bc268c8377630e57b561f7a513831fbaee))
* **deploy:** require matching Pages build evidence ([9060562](https://github.com/XPoet/picx/commit/906056221aab4d1c3ad10ff1b2b39a267221cad7))
* **i18n:** detect browser language instead of IP region ([b57f13a](https://github.com/XPoet/picx/commit/b57f13a5743f0bd30c777e8c2cad768b03011620))
* **i18n:** follow browser language after logout ([f7519c5](https://github.com/XPoet/picx/commit/f7519c5afcaeafb07cdde1bc0591ff39ad48da14))
* **i18n:** merge browser language detection into develop ([51f13a0](https://github.com/XPoet/picx/commit/51f13a04c44f4986a5367d8ca9758d6b86058702))
* **layout:** keep the header navigation fixed while scrolling ([42c4848](https://github.com/XPoet/picx/commit/42c4848a6aa61a870affc31ce3d159a4bdd26e01))
* **links:** share safe previews and recover clipboard failures ([5f17dd2](https://github.com/XPoet/picx/commit/5f17dd2daa5408b644b237226b487c33e7e90fdd))
* **settings:** make cloud sync revision aware and recoverable ([4bc71e0](https://github.com/XPoet/picx/commit/4bc71e052a6374eef1ddb52204370acc75d8f4e2))
* **test:** update stale UI assertions and remove obsolete cases ([e3601f8](https://github.com/XPoet/picx/commit/e3601f8fd57ce4452e11f1bb2f726574e2811da8))
* **ui:** align upload workspace with visual acceptance baseline ([ec59974](https://github.com/XPoet/picx/commit/ec5997454aa340ed86e26902867341d6bfcaccce))
* **upload:** report committed item results with frozen batch targets ([e3919ee](https://github.com/XPoet/picx/commit/e3919eea5037468ec456bd367ca175a3846c6a5a))
* **upload:** scope shortcuts and cancel stale workspace tasks ([492c243](https://github.com/XPoet/picx/commit/492c243bc91e126478c2874d7c6ff5e15bd6af72))
* **upload:** show loading while compressing queued images ([ae46e13](https://github.com/XPoet/picx/commit/ae46e131c12b89afa2432774ce5f920e212bca63))
* **upload:** unify naming rules and validate actual file sizes ([113f0cd](https://github.com/XPoet/picx/commit/113f0cdb1c988be79aa7d55998ba05120fdb1c17))
* **upload:** use Element Plus scrollbar for image queue ([7058ce0](https://github.com/XPoet/picx/commit/7058ce0ec420ac9c556aaede3fd4f69ee6026a1b))

### 📈 Performance Improvements

* **settings:** optimize the UI and interaction of the image hosting settings ([daa97f6](https://github.com/XPoet/picx/commit/daa97f6592d8b5b5436133b6e92a50980d43c329))

### 💄 UI Improvements

* adjust home page UI ([0894f03](https://github.com/XPoet/picx/commit/0894f03c8c3f2be3cc37ff45221a5b4da5de7914))
* **home:** add a display for the currently logged-in account ([3fc94de](https://github.com/XPoet/picx/commit/3fc94de549362a3c3d8ac50505ed93642aaedeb5))
* **management:** optimize the UI of the images management page ([e440d55](https://github.com/XPoet/picx/commit/e440d552574c46bc0d9e5f9446e2ab048ad6789e))
* page layout has been changed to two columns on the left and right ([517885e](https://github.com/XPoet/picx/commit/517885e2bb23d77f95db45f2384fecff9e1c8156))
* **upload:** adjust the entry point for Change Upload Directory ([6105269](https://github.com/XPoet/picx/commit/6105269078d8043d59aed923a4ba877c0f8dc72d))
* **upload:** optimize the UI of the image file details window ([a3d8b38](https://github.com/XPoet/picx/commit/a3d8b38b45f6237a720fc3e72ee7e6e2d8acf835))
* **upload:** optimize the UI of the upload page ([056a9c2](https://github.com/XPoet/picx/commit/056a9c27eb5b44f5cde37770fec2b848e3275b26))

### 🔨 Code Refactoring

* **upload:** schedule image processing from the workspace ([702c9d9](https://github.com/XPoet/picx/commit/702c9d9f71bf0a916a6e28da9d9da942ff76ef88))

### 📦 Chores

* designated repository name is picx-images-hosting ([20b28b9](https://github.com/XPoet/picx/commit/20b28b90c405d30aff163506e2d3622b6e3c9815))

## [3.1.2](https://github.com/XPoet/picx/compare/v3.1.1...v3.1.2) (2026-10-14)

### 📦 Chores

* **ci:** update release configuration ([f28078e](https://github.com/XPoet/picx/commit/f28078ed4d753033308d9cfde9d54a2d7f07a952))
* **i18n:** update locales ([567bfe1](https://github.com/XPoet/picx/commit/567bfe138808dde93571186198453b44a3015fa4))
* update GitHub APP Redirect URI ([6e97ef8](https://github.com/XPoet/picx/commit/6e97ef8656d8ed7b9e085eeb1bfb7690525c2194))

## [3.1.1](https://github.com/XPoet/picx/compare/v3.1.0...v3.1.1) (2026-10-14)

## [3.1.0](https://github.com/XPoet/picx/compare/v3.0.2...v3.1.0) (2026-10-14)

### ✨ Features

* add Ctrl/Cmd + D shortcut for one-click deploy ([#340](https://github.com/XPoet/picx/issues/340)) ([ec25c8d](https://github.com/XPoet/picx/commit/ec25c8d4138713029304b5511139a299df725e94))
* add custom domain CNAME setting for image hosting deploy ([eed2e0a](https://github.com/XPoet/picx/commit/eed2e0a4b50fd27487785c5b76d7059c9c9b908b))
* add jump to GitHub repository in context menu ([82212f0](https://github.com/XPoet/picx/commit/82212f01d9d29e692c9ecfc9353efa2e06ad8ed7))
* add service worker runtime cache for image hosting images ([faf180b](https://github.com/XPoet/picx/commit/faf180bfc4a7081d5230fef00f40b486f212a30a))
* add sort modes to the management page image list ([300c45d](https://github.com/XPoet/picx/commit/300c45d666f6a3971a5a56a4d66deb9ac368abfb))
* add timestamp naming option to image name settings ([#339](https://github.com/XPoet/picx/issues/339)) ([7dd5ec4](https://github.com/XPoet/picx/commit/7dd5ec47731c47dcee29e4276a2cd253bcc58ef5))
* check remote gh-pages branch before selecting GitHub Pages rule ([62fd8f3](https://github.com/XPoet/picx/commit/62fd8f30e66ab2c9f2e5d5be09a9f569ce94d979))
* full-screen watermark settings ([d6187ba](https://github.com/XPoet/picx/commit/d6187baee43d21c58a4d1cbb6d00175edf02ab9f))
* support png compression algorithm ([1ce0812](https://github.com/XPoet/picx/commit/1ce0812ded8805c4d9fb46056b7d4c8412a64120))
* support renaming and deleting directories and moving images in management page ([#175](https://github.com/XPoet/picx/issues/175),[#331](https://github.com/XPoet/picx/issues/331)) ([6bf5107](https://github.com/XPoet/picx/commit/6bf510781b3fa178b07dd446fc5ca1dbc15b29ef))
* support uploading and managing mp4 videos ([6fa6272](https://github.com/XPoet/picx/commit/6fa62723d48a5409267f9df44f1bd5a3637feb02))
* sync settings with cloud .settings file silently ([ef05324](https://github.com/XPoet/picx/commit/ef0532470c6a0db80fce813b4007ebafa95f7229))
* use picx-ih repo when picx-images-hosting does not exist ([ede8854](https://github.com/XPoet/picx/commit/ede88543f9c63bfd6f4973398da561d5ef4176b2))

### 🐞 Bug Fixes

* **ci:** fixed error where dependency installation fails in the workflow ([b28e953](https://github.com/XPoet/picx/commit/b28e953093c7ddc9309cc5fd41ab4ac8b0906137))
* corrected document jump link ([035bbf6](https://github.com/XPoet/picx/commit/035bbf6a5d398e76515a6fc32741aeb81e2d699e))

### 📈 Performance Improvements

* **i18n:** update languages ([b401dc6](https://github.com/XPoet/picx/commit/b401dc66f9d3e2b819ffba3410431aa63fce5998))

### 💄 UI Improvements

* optimize style ([ba398a7](https://github.com/XPoet/picx/commit/ba398a7781d12e2f5cb947383f24619ccb0ef991))

### 🔨 Code Refactoring

* upgrade of the technical stack ([075d912](https://github.com/XPoet/picx/commit/075d912d5d1d506e939d72c2ee08c5c4edffa305))
