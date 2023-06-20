
if [ "$1" -eq 1 ]; then
    echo "Running the script..."
    node clearData.cjs && node initData.js
fi

k6 run -e PERMIFY_HOST=$PERMIFY_HOST -e TEST_TYPE=$TEST_TYPE permifyTest.js
