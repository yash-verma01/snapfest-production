# Test Authentication Flow Script
$baseUrl = "http://localhost:5001/api"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-ColorOutput Yellow "`n🧪 Testing: $Name"
    Write-ColorOutput Yellow "   $Method $Url"
    
    try {
        $params = @{
            Uri = "$baseUrl$Url"
            Method = $Method
            ContentType = "application/json"
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-ColorOutput Green "   ✅ SUCCESS (Status: $($response.StatusCode))"
            if ($response.Content) {
                $content = $response.Content | ConvertFrom-Json
                Write-Output "   Response: $($content | ConvertTo-Json -Depth 3 | Select-Object -First 200)"
            }
            return @{ Success = $true; Data = $response.Content }
        } else {
            Write-ColorOutput Red "   ❌ FAILED - Expected status $ExpectedStatus, got $($response.StatusCode)"
            return @{ Success = $false; Error = "Wrong status: $($response.StatusCode)" }
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-ColorOutput Green "   ✅ SUCCESS (Expected error status: $ExpectedStatus)"
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                $reader.Close()
                Write-Output "   Response: $responseBody"
            } catch {
                Write-Output "   (No response body)"
            }
            return @{ Success = $true; Data = $responseBody }
        } else {
            Write-ColorOutput Red "   ❌ FAILED - $($_.Exception.Message)"
            if ($statusCode) {
                Write-ColorOutput Red "   Status: $statusCode"
            }
            return @{ Success = $false; Error = $_.Exception.Message }
        }
    }
}

Write-ColorOutput Blue "`n🚀 Starting Authentication Flow Tests"
Write-ColorOutput Blue ("=" * 60)

# Test 1: Health check
Test-Endpoint -Name "Health Check" -Method "GET" -Url "/health"

# Test 2: Test Clerk session endpoint
Test-Endpoint -Name "Clerk Test Endpoint (No Auth)" -Method "GET" -Url "/test/clerk"

# Test 3: User sync endpoint
Write-ColorOutput Blue "`n📝 Testing User Sync Endpoint"
Test-Endpoint -Name "User Sync (No Role)" -Method "POST" -Url "/users/sync" -Body @{}
Test-Endpoint -Name "User Sync (User Role)" -Method "POST" -Url "/users/sync?role=user" -Body @{}
Test-Endpoint -Name "User Sync (Vendor Role)" -Method "POST" -Url "/users/sync?role=vendor" -Body @{}
Test-Endpoint -Name "User Sync (Admin Role)" -Method "POST" -Url "/users/sync?role=admin" -Body @{}

# Test 4: Vendor sync endpoint (should require auth)
Write-ColorOutput Blue "`n📝 Testing Vendor Sync Endpoint"
Test-Endpoint -Name "Vendor Sync (No Auth)" -Method "POST" -Url "/vendors/sync" -Body @{} -ExpectedStatus 401

# Test 5: Role-based auth endpoints (should require auth)
Write-ColorOutput Blue "`n📝 Testing Role-Based Auth Endpoints"
Test-Endpoint -Name "User Auth /me (No Auth)" -Method "GET" -Url "/auth/user/me" -ExpectedStatus 401
Test-Endpoint -Name "Vendor Auth /me (No Auth)" -Method "GET" -Url "/auth/vendor/me" -ExpectedStatus 401
Test-Endpoint -Name "Admin Auth /me (No Auth)" -Method "GET" -Url "/auth/admin/me" -ExpectedStatus 401

# Test 6: Legacy register endpoint
Write-ColorOutput Blue "`n📝 Testing Legacy Register Endpoint"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$testUser = @{
    name = "Test User"
    email = "testuser$timestamp@example.com"
    phone = "1234567890"
    password = "Test123!@#"
    role = "user"
}
Test-Endpoint -Name "User Register" -Method "POST" -Url "/auth/register" -Body $testUser -ExpectedStatus 201

# Test 7: Legacy login endpoint
Write-ColorOutput Blue "`n📝 Testing Legacy Login Endpoint"
$loginData = @{
    email = $testUser.email
    password = $testUser.password
}
Test-Endpoint -Name "User Login" -Method "POST" -Url "/auth/login" -Body $loginData -ExpectedStatus 200

Write-ColorOutput Green "`n✅ All Tests Completed!"
Write-ColorOutput Blue ("=" * 60)
Write-ColorOutput Blue "`n📋 Summary:"
Write-ColorOutput Green "   - Health check endpoint tested"
Write-ColorOutput Green "   - Clerk sync endpoints tested"
Write-ColorOutput Green "   - Role-based auth endpoints tested"
Write-ColorOutput Green "   - Legacy register/login endpoints tested"
Write-ColorOutput Yellow "`n⚠️  Note: Full authentication testing requires Clerk session cookies"
Write-ColorOutput Yellow "   To test with real Clerk sessions, use the frontend application"

