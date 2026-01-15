# Claude Code Notes

**Canonical instructions are in `AGENTS.md`.**

If anything conflicts, follow `AGENTS.md`.

---

## Quick Reference

```bash
# Golden Commands (always use these)
./tools/contract format
./tools/contract lint
./tools/contract test
./tools/contract build

# Check active stack
cat .repo/active-stack

# Apply a stack
./tools/kickoff/apply_stack.sh <stack_id>

# Policy check
./tools/policy/check_required_artifacts.sh
```

## Key Paths

- Process docs: `docs/00_process/`
- Product docs: `docs/01_product/`
- Architecture: `docs/02_architecture/`
- Quality: `docs/03_quality/`
- Delivery: `docs/04_delivery/`
- Stack Packs: `stacks/<stack_id>/`
