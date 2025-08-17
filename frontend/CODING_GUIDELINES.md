# Coding Guidelines

## 📁 File Organization

### Directory Structure
```
src/
├── components/           # Reusable UI components (<30 lines each)
├── pages/               # Route components (<200 lines each)
├── hooks/               # Custom React hooks
├── contexts/            # React contexts
├── services/            # API and external service calls
├── utils/               # Pure utility functions
├── types/               # TypeScript type definitions
└── styles/              # CSS and styling files
```

### File Naming
- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with "use" prefix (`useApiCall.ts`)
- **Utils**: camelCase (`formatDate.ts`)
- **Types**: camelCase (`userTypes.ts`)

## 🔧 Code Organization Principles

### 1. Single Responsibility Principle
- Each file should have ONE clear purpose
- Components should do ONE thing well
- Functions should have a single, well-defined task

### 2. Don't Repeat Yourself (DRY)
- Extract common logic into custom hooks
- Create reusable components for repeated UI patterns
- Use utility functions for repeated calculations
- Define constants for magic numbers and strings

### 3. File Size Limits
- **Components**: Max 200 lines
- **Functions**: Max 30 lines
- **Complexity**: Max 8 cyclomatic complexity
- **Parameters**: Max 3 parameters per function

### 4. Component Decomposition
When a component grows large, split it into:
- **Container components**: Handle state and logic
- **Presentation components**: Handle display only
- **Custom hooks**: Extract stateful logic
- **Utility functions**: Extract pure logic

## 🎯 Best Practices

### Custom Hooks
Extract stateful logic into hooks when you see:
- Same useState/useEffect patterns repeated
- Complex state management in multiple components
- API calls that could be reused

```typescript
// ✅ Good: Extract API logic
const useRoadmapData = (slug: string) => {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  // ... logic
  return { roadmap, loading, error };
};
```

### Component Composition
Break large components into smaller, focused pieces:

```typescript
// ✅ Good: Composed component
const RoadmapEditor = () => (
  <div>
    <RoadmapHeader />
    <RoadmapContent />
    <RoadmapActions />
  </div>
);
```

### Utility Functions
Create pure functions for reusable logic:

```typescript
// ✅ Good: Pure utility
export const formatQuarter = (quarter: string): string => {
  return quarter.replace('-', ' Q');
};
```

### Constants
Define constants to avoid magic numbers/strings:

```typescript
// ✅ Good: Named constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png'];
```

## 🚨 Code Smells to Avoid

### Large Files
- Files over 200 lines should be split
- Look for natural separation points
- Extract helpers and sub-components

### Repeated Code
- Same logic in multiple places
- Copy-pasted component patterns
- Identical API call patterns

### Complex Functions
- Functions with high cyclomatic complexity
- Too many parameters (>3)
- Functions doing multiple things

### Tight Coupling
- Components knowing too much about each other
- Direct imports between unrelated modules
- Hard-coded dependencies

## 🛠️ Refactoring Guidelines

### When to Refactor
1. File exceeds size limits
2. Function becomes complex
3. Code is repeated 3+ times
4. Component has multiple responsibilities

### How to Refactor
1. **Extract Components**: Split UI into smaller pieces
2. **Extract Hooks**: Move stateful logic to custom hooks
3. **Extract Utils**: Move pure functions to utilities
4. **Extract Constants**: Replace magic values with named constants

### Example Refactoring
```typescript
// ❌ Before: Large component with mixed concerns
const UserDashboard = () => {
  // 200+ lines of mixed logic
};

// ✅ After: Composed from smaller pieces
const UserDashboard = () => (
  <div>
    <UserHeader />
    <UserStats />
    <UserActivity />
  </div>
);
```

## 🔍 Code Review Checklist

- [ ] File under 200 lines?
- [ ] Functions under 30 lines?
- [ ] No repeated code?
- [ ] Single responsibility?
- [ ] Meaningful names?
- [ ] No magic numbers?
- [ ] Proper TypeScript types?
- [ ] ESLint rules passing?

## 📊 Monitoring Code Quality

Use these commands to check code quality:
```bash
npm run lint          # Check ESLint rules
npm run build         # Verify TypeScript compilation
npx tsc --noEmit      # Type checking only
```

Track file sizes regularly:
```bash
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -nr
```