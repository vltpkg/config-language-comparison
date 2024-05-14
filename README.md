# config language test

Helping us decide which implementation to use for vlt configs.

## USAGE

```
npm it
```

Output goes in `./output`, benchmarks printed to stdout.

## Results

```
bigger number is better, ops / ms

# @iarna/toml
> stringify 0.456
> parse     0.286

# @ltd/j-toml
> stringify 0.032
> parse     0.238

# smol-toml
> stringify 1.024
> parse     0.479

# yaml
> stringify 0.099
> parse     0.037

# js-yaml
> stringify 0.258
> parse     0.439

# polite-json
> stringify 3.228
> parse     2.115

# JSON (the built-in one)
> stringify 3.232
> parse     2.128

# ini
> stringify 0.411
> parse     0.325
```
