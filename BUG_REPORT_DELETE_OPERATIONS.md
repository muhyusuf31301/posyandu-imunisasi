# 🔴 CRITICAL BUG REPORT: DELETE OPERATIONS

**Date:** 2026-03-27
**Severity:** CRITICAL 🔴
**Status:** IDENTIFIED & SOLUTION PROVIDED

---

## Executive Summary

When users delete data (child or mother), **wrong rows are deleted from Google Sheets** due to incomplete header row filtering in the n8n DELETE workflow.

### Issues
1. **Delete Anak:** Deletes row ABOVE the target child
2. **Delete Ibu:** Deletes children from ABOVE the target mother

### Root Cause
The "Cari Row Anak" code node in n8n DELETE workflow uses incomplete header filtering:
```javascript
.filter(r => r.NIK_Ibu !== '')  // ❌ Doesn't exclude header row
```

Should be:
```javascript
.filter(r => r.NIK_Ibu !== '' && r.NIK_Ibu !== 'NIK_Ibu')  // ✅ Excludes header
```

---

## Technical Details

### How the Bug Occurs

**Google Sheets API returns:**
```json
[
  {NIK: "NIK", NIK_Ibu: "NIK_Ibu", Nama: "Nama"},      // Row 1 - HEADER
  {NIK: "1", NIK_Ibu: "A001", Nama: "Budi"},           // Row 2 - DATA
  {NIK: "2", NIK_Ibu: "A001", Nama: "Andi"},           // Row 3 - DATA
  {NIK: "3", NIK_Ibu: "B002", Nama: "Citra"}           // Row 4 - DATA
]
```

**Current filter:** `r.NIK_Ibu !== ''`
- Condition `"NIK_Ibu" !== ''` evaluates to **TRUE** (header passes!)
- Filtered array includes the header row

**Filtered array (WRONG):**
```
rows[0] = HEADER row
rows[1] = Row 2 (Budi)
rows[2] = Row 3 (Andi)
rows[3] = Row 4 (Citra)
```

**When deleting "Andi" (expected Row 3):**
```
User selects: Andi (Row 3)
findIndex finds: rows[2]
idx = 2
rowNum = 2 + 2 = 4  ❌ WRONG! (should be 3)
Deletes: Row 4 (Citra instead of Andi)
```

### Why It Happens
The header row from Google Sheets contains field names as string values:
- `NIK_Ibu` field has value `"NIK_Ibu"`
- Empty string check `!== ''` doesn't catch this
- Only explicit check `!== 'NIK_Ibu'` excludes it

---

## Files Affected

**File:** `Posyandu - DELETE Endpoints v2.json`

**Nodes to Fix:**
1. **"Cari Row Anak"** - Delete single child operation
2. **"Cari Row Ibu+Anak"** - Delete mother + cascade delete children

---

## Solution

### Fix #1: "Cari Row Anak" Node

**Location:** n8n Posyandu - DELETE Endpoints v2.json → Code node "Cari Row Anak"

**Change Line 2 from:**
```javascript
const rows = $input.all().map(i => i.json).filter(r => r && r.NIK_Ibu && r.NIK_Ibu !== '');
```

**To:**
```javascript
const rows = $input.all().map(i => i.json).filter(r => r && r.NIK_Ibu && r.NIK_Ibu !== '' && r.NIK_Ibu !== 'NIK_Ibu');
```

**Full corrected code:**
```javascript
const body = $('POST delete-anak').first().json.body;
const rows = $input.all()
  .map(i => i.json)
  .filter(r => r && r.NIK_Ibu && r.NIK_Ibu !== '' && r.NIK_Ibu !== 'NIK_Ibu');

const idx = rows.findIndex(r =>
  String(r.NIK_Ibu||'').trim() === String(body.nikIbu||'').trim() &&
  String(r.Nama||'').trim()    === String(body.name||'').trim()
);

if (idx < 0) throw new Error('Anak tidak ditemukan: ' + body.name);

return [{ json: { rowNum: idx + 2 } }];
```

### Fix #2: "Cari Row Ibu+Anak" Node (Consistency)

Already uses correct filtering `!== 'NIK_Ibu'`, but verify both "Read Anak (del ibu)" operations use the same pattern:

**Ensure filter includes:**
```javascript
.filter(r => r && r.NIK_Ibu && r.NIK_Ibu !== '' && r.NIK_Ibu !== 'NIK_Ibu')
```

---

## Implementation Steps

1. **Open n8n workflow:**
   - Go to: Posyandu - DELETE Endpoints v2
   - Find node: "Cari Row Anak"

2. **Edit the code:**
   - Click on the node
   - In the JavaScript section, find the filter line
   - Add: `&& r.NIK_Ibu !== 'NIK_Ibu'`

3. **Test the fix:**
   - Save the workflow
   - In the app, test: **Hapus Data Anak**
   - Verify: correct child row is deleted
   - Test: **Hapus Ibu** with multiple children
   - Verify: correct mother + all her children deleted

4. **Verify data integrity:**
   - Check Google Sheets
   - Confirm no unintended rows were affected
   - Check for orphaned children rows

---

## Testing Checklist

After applying the fix:

- [ ] **Test 1:** Delete single child
  - Action: Click "Hapus Data Anak" on any child
  - Expected: That specific child's row deleted
  - Verify: Correct row missing from Google Sheets

- [ ] **Test 2:** Delete mother with multiple children
  - Action: Click "Hapus Ibu" on a mother with 3+ children
  - Expected: Mother row deleted + ALL her children deleted
  - Verify: All 4 rows (1 mother + 3 children) missing from Google Sheets

- [ ] **Test 3:** Delete mother with no children
  - Action: Click "Hapus Ibu" on a mother with no children
  - Expected: Only mother row deleted
  - Verify: Mother row missing, no other rows affected

- [ ] **Test 4:** Data consistency
  - Action: Reload app, check data in UI matches Google Sheets
  - Expected: All remaining data intact and correct

- [ ] **Test 5:** Edge cases
  - Action: Delete first child, delete last child, delete middle child
  - Expected: Correct rows deleted in each case

---

## Comparison: Why Delete Works Differently

**Delete Ibu uses correct filter:**
```javascript
.filter(r => r && r.NIK_Ibu && r.NIK_Ibu !== 'NIK_Ibu')  // ✅ Explicit
```

**Delete Anak uses incomplete filter:**
```javascript
.filter(r => r && r.NIK_Ibu && r.NIK_Ibu !== '')  // ❌ Implicit, fails
```

This inconsistency is why both operations show similar symptoms but Delete Ibu was partially working.

---

## Prevention for Future

- Always explicitly check for header row field names
- Use consistent filter patterns across all workflows
- Test delete operations with sample data before deploying
- Document expected vs. actual row numbers during deletion

---

## Files to Update

1. `Posyandu - DELETE Endpoints v2.json` - n8n workflow

**No changes needed to:**
- `src/App.jsx` - Frontend code is correct
- `Posyandu v7.json` - Main workflow unaffected
- Google Sheets structure - No schema changes

---

## Contact & Support

If issues persist after applying the fix:
1. Check n8n logs for error messages
2. Verify Google Sheets API permissions
3. Test with sample data first
4. Check data format consistency in Sheets
