# Ensures this only runs after npm prepublish
if node -e "process.exit(($npm_config_argv).original[0].indexOf('pu') === 0)"; then
  exit 0;
fi

# Ensures pushes to npm only happen from Travis
if [ "$CI" != true ]; then
  echo "\n\n\n  \033[101;30m Only Travis CI can publish to NPM. \033[0m" 1>&2;
  exit 1;
fi;

# Builds files before publishing
npm run build;
