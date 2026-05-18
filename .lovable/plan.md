## Plan to get AI Advisor responding

### What I found
- The app is sending the AI request correctly from the browser.
- The request never reaches `ai-advisor` logs, which matches the current backend status: the hosted backend is paused.
- Because the backend is paused, the browser reports a generic `Load failed` instead of an AI response.

### Fix path
1. **Reactivate Lovable Cloud backend**
   - Open the project’s **Backend / Lovable Cloud** view.
   - Resume the backend from the Overview/status area.
   - Wait until it shows active/ready.

2. **Retest the deployed AI function**
   - Call `ai-advisor` directly once the backend is active.
   - Check function logs for gateway errors, missing AI key, rate limits, or credit issues.

3. **Improve AI function reliability**
   - Update `supabase/functions/ai-advisor/index.ts` to use the recommended Lovable AI Gateway headers instead of the current raw bearer pattern.
   - Preserve streaming responses.
   - Return clearer error messages for missing AI key, rate limits, credits, and gateway failures.

4. **Improve frontend error handling**
   - Keep the user’s message visible if the request fails.
   - Show a more useful error toast when the backend is unavailable versus when AI credits/rate limits are the problem.

5. **Deploy and verify**
   - Deploy the updated `ai-advisor` function.
   - Test from the AI Advisor page and confirm a real response appears.

### Important note
No code change can make the AI Advisor work while the hosted backend remains paused; reactivation must happen first. After it is active, I can apply the code-side reliability fixes and verify the response end-to-end.