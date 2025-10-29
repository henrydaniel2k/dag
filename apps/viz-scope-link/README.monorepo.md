# Viz Scope Link - Monorepo Integration

Project này đã được tích hợp vào Nx monorepo. Dưới đây là các lệnh để làm việc với project:

## Các lệnh Nx

### Development

```bash
# Chạy development server
nx dev viz-scope-link

# Hoặc từ root của workspace
nx run viz-scope-link:dev
```

### Build

```bash
# Build production
nx build viz-scope-link

# Build development
nx build viz-scope-link --configuration=development
```

### Testing

```bash
# Chạy tests
nx test viz-scope-link

# Chạy tests ở watch mode
nx test:watch viz-scope-link
```

### Linting

```bash
# Chạy linter
nx lint viz-scope-link
```

### Preview

```bash
# Preview production build
nx preview viz-scope-link
```

## Cài đặt Dependencies

Tất cả dependencies được quản lý ở root level của monorepo. Để cài đặt dependencies mới:

```bash
# Từ root của workspace
npm install <package-name> -w viz-scope-link

# Hoặc dev dependencies
npm install -D <package-name> -w viz-scope-link
```

## Nx Caching

Nx tự động cache kết quả build, test và các tasks khác. Điều này giúp tăng tốc độ development đáng kể.

## Project Graph

Xem project graph để hiểu dependencies:

```bash
nx graph
```

Hoặc chỉ xem graph của project này:

```bash
nx graph --focus viz-scope-link
```
