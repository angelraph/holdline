# Getting the keys Holdline needs

You need **two API keys** to run Holdline live, and **two accounts** to submit it.

## 1. Nebius Token Factory key (required — runs the NVIDIA Nemotron models)

1. Open **https://tokenfactory.nebius.com**
2. Click **Sign in** and create an account (Google or GitHub login works).
3. If the hackathon gave you a credits code, add it under **Billing** (check your hackathon email / Devpost updates / Discord for the code).
4. In the left menu open **API keys** → **Create API key**. Name it `holdline`.
5. Copy the key right away (it is only shown once). It looks like a long random string.
6. Optional check: open **Models** in the menu and search "Nemotron". You should see models like `Nemotron-3-Ultra`, `nemotron-3-super`, `Nemotron-3.5-Super-VL`, and a Nano model.

Docs: https://docs.tokenfactory.nebius.com

## 2. Tavily key (required — live law lookups, citation checks, "find help near me")

1. Open **https://app.tavily.com**
2. Sign up (Google / GitHub / email).
3. Your key is on the dashboard home page, starting with `tvly-`. Click copy.
4. The free plan gives 1,000 credits per month — enough for building, testing, and judging.

Docs: https://docs.tavily.com

## 3. Put the keys in the project

Open the file `.env` in the project folder (`C:\Users\Admin\Desktop\Monendum\.env`) and fill in:

```
NEBIUS_API_KEY=paste-your-nebius-key-here
TAVILY_API_KEY=tvly-paste-your-tavily-key-here
```

Save the file. Never commit `.env` to GitHub — it is already in `.gitignore`.
(Or just paste the keys in the chat and Claude will put them in `.env` for you.)

## 4. GitHub account (needed to submit)

1. **https://github.com/signup** — create a free account (skip if you have one).
2. Tell Claude your GitHub username. The repo will be public with an MIT license, as the rules require.

## 5. YouTube account (needed for the demo video)

1. **https://studio.youtube.com** — sign in with a Google account and create a channel if asked.
2. The video must be **public** and **3 minutes or less**. Claude will write the script.

## 6. Devpost submission page

**https://nebiusglobalaihackathon.devpost.com** → *Enter a submission*.
Deadline: **Friday Oct 30, 2026, 10:00 AM PT (6:00 PM GMT+1)**. Submit early.
