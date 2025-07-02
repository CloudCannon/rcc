
# Maintenance

## Adding the rosey-connector directory to downstream repositories

To add a single folder as an upstream dependency, we can use a git subtree.

[Using this as a guide:](https://gist.github.com/tswaters/542ba147a07904b1f3f5)

### Initial setup

Initial setup of fetching the `rosey-connector` directory from https://github.com/CloudCannon/rcc, for use in a downstream repository. This allows us to maintain the RCC logic in one place.

```bash
# Add remote to upstream repo, create new tracking branch, fetch immediately 
# An alias may need to be set if using multiple SSH keys
git remote add -f rcc-upstream git@github.com:CloudCannon/rcc.git
git checkout -b upstream/rcc rcc-upstream/main

# Split off subdir of tracking branch into separate branch
git subtree split -q --squash --prefix=rosey-connector --annotate="[rcc] " --rejoin -b merging/rcc

# Add the split subdir on separate branch as a subdirectory on staging
git checkout staging
git subtree add --prefix=rosey-connector --squash merging/rcc
```

### Pulling from upstream

Pulling changes to the `rosey-connector` directory from https://github.com/CloudCannon/rcc.

```bash
# switch back to tracking branch, fetch & rebase.
git checkout upstream/rcc 
git pull rcc-upstream/main

# update the separate branch with changes from upstream
git subtree split -q --prefix=rosey-connector --annotate="[rcc] " --rejoin -b merging/rcc

# switch back to staging and use subtree merge to update the subdirectory
git checkout staging
git subtree merge -q --prefix=rosey-connector --squash merging/rcc
```
