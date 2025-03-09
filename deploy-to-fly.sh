fly deploy --config fly/temporal-worker.toml \
fly deploy --config fly/twilio-worker.toml \
fly deploy --config fly/openai-worker.toml

#!/bin/bash

# Open a new terminal window and execute a command
osascript <<EOF
tell application "Temporal Worker"
    activate
    do script "echo 'Window 1: Running command...'; fly deploy --config fly/temporal-worker.toml"
end tell
EOF

sleep 1

osascript <<EOF
tell application "Twilio Worker"
    activate
    do script "echo 'Window 2: Running another command...'; fly deploy --config fly/twilio-worker.toml"
end tell
EOF

sleep 1

osascript <<EOF
tell application "OpenAI Worker"
    activate
    do script "echo 'Window 3: Running a different command...'; fly deploy --config fly/openai-worker.toml"
end tell
EOF
