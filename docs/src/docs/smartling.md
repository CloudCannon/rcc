---
_schema: page
permalink: /docs/smartling/
title: Smartling Integration
layout: layouts/page.html
eleventyNavigation:
  key: Smartling Integration
  order: 3
tags: page
SEO_options:
  title:
  image:
  description:
draft: false
---

This project allows for [automatic AI-powered translations](https://www.smartling.com/software/smartling-translate/) via Smartling. It uses the [Node.js SDK](https://help.smartling.com/hc/en-us/articles/4405992477979-Node-js-SDK) integration. For this to work you must sign up for a Smartling account to receive API credentials, which you can enter in the CloudCannon site's environment variables and RCC configuration file.


To add automatic AI-powered translations - which your editors can then QA in CloudCannon:


1. Add your secret API key to your environment variables with the key of `DEV_USER_SECRET` in CloudCannon on the site that the translation file generation is occurring. This will be your staging site if you are using a staging -> production workflow. You can also set this locally in a `.env` file if you want to test it in your development environment. Save your changes and wait for the build to finish.

2. Enable Smartling in your `rosey/rcc.yaml` file, by setting `enabled: true` under the Smartling section. 

3. Fill in your `dev_project_id`, and `dev_user_identifier`, with the values given to you by Smartling.

4. Save your changes. Your translations should now be sent to Smartling.

> Make sure to not push any secret API keys to your source control. Make sure the `.env` file is in your `.gitignore` if you are testing locally.

> **Be aware these translations have some cost involved**, so make sure you understand the pricing around Smartling machine-translations before enabling this.

## What gets sent to Smartling

A phrase will be sent away to Smartling for automatic translation if, in at least one language:
- there is no translation for the key, and
- we have not received a translation for the key from Smartling in the past


If you use the recommended approach of using the text content of each tagged element as its `data-rosey` ID and change an original phrase the RCC will detect it's a new phrase because it sees a new key, and it will be sent away to Smartling. If you decide to use a different approach, for example using a fixed key that doesn't change when you change the original content, the RCC won't detect its a new phrase and it won't be sent to Smartling for translation.


The RCC will keep track of all the translations we've received in the past from Smartling to avoid sending a phrase to Smartling that it's already translated. This is because if Smartling receives only phrases it's already translated, it won't send anything back and the build will get stuck on the `AWAITING_AUTHORIZATION` step. It also ensures we don't pay to translate phrases we've already translated. The translations are kept in a flat object, where scaling shouldn’t be an issue.


We never automatically archive the translations we've received from Smartling to help prevent this situation from arising. However, if you've disabled the Smartling integration and don’t think you’ll ever use it, you can simply delete these files and directories for tidiness if you like.


## Clearing a translation

If you clear a translation, and the original phrase has not been translated by Smartling before, it will be overwritten when the next Smartling call happens - aka when any new phrase is added. This won’t be a problem if you’ve manually entered a different translation to the input, however if you want to use the original untranslated text on the translated version of the page, you cannot rely on the fallback as you could without the Smartling integration enabled, so you must enter the original text yourself as the translation to avoid it being overwritten by the Smartling translation.
