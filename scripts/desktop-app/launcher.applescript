-- CAPM Prep desktop launcher.
--
-- One-shot AppleScript: starts the production server in the background if
-- it isn't already running, waits for it to respond, then opens the app in
-- the user's default browser.
--
-- The PROJECT_PATH placeholder is replaced at install time by install.sh
-- so the compiled .app is portable to a different project location.

property projectPath : "__PROJECT_PATH__"
property appUrl : "http://localhost:3000"
property npmBin : "/usr/local/bin/npm"
property logPath : "/tmp/capm-prep.log"

on serverIsUp()
	try
		do shell script "/usr/bin/curl -s -o /dev/null -w '%{http_code}' " & appUrl & " | grep -E '^(200|3..)$'"
		return true
	on error
		return false
	end try
end serverIsUp

on portInUse()
	try
		do shell script "/usr/sbin/lsof -ti :3000"
		return true
	on error
		return false
	end try
end portInUse

on resolveNodeBin()
	-- Find the directory containing both `node` and `npm` by asking a login
	-- zsh (which sources the user's profile and has Homebrew / nvm / volta
	-- on PATH). Returns "" if not found.
	try
		return do shell script "/bin/zsh -lc 'command -v npm'"
	end try
	try
		return do shell script "/bin/bash -lc 'command -v npm'"
	end try
	return ""
end resolveNodeBin

on run
	-- If the server is already up, just open the browser and exit.
	if serverIsUp() then
		do shell script "/usr/bin/open " & appUrl
		return
	end if

	if portInUse() then
		display dialog "Port 3000 is in use by another process. Close it before launching CAPM Prep." buttons {"OK"} default button 1 with icon caution
		return
	end if

	set npmPath to resolveNodeBin()
	if npmPath is "" then
		display dialog "Couldn't find npm. Install Node.js or update launcher.applescript." buttons {"OK"} default button 1 with icon stop
		return
	end if

	-- Critical: when Finder/launchd spawn this script, PATH does NOT include
	-- /usr/local/bin (or wherever node lives), so npm's `#!/usr/bin/env node`
	-- shebang fails. Prepend node's directory to PATH before spawning.
	set nodeDir to do shell script "/usr/bin/dirname " & quoted form of npmPath
	do shell script "cd " & quoted form of projectPath & " && PATH=" & quoted form of nodeDir & ":$PATH nohup " & quoted form of npmPath & " start > " & logPath & " 2>&1 & disown"

	-- Poll up to ~30 seconds for the server to come up, then open the browser.
	set attempts to 0
	repeat until serverIsUp() or attempts is 60
		delay 0.5
		set attempts to attempts + 1
	end repeat

	if serverIsUp() then
		do shell script "/usr/bin/open " & appUrl
	else
		display dialog "CAPM Prep server didn't respond after 30s. Check " & logPath & " for details." buttons {"OK"} default button 1 with icon caution
	end if
end run
