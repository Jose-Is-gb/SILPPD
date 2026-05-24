 = Get-ChildItem -Path . -Recurse -Filter *.html
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false

    if ($content -notmatch "Content-Security-Policy") {
        $csp = "<meta http-equiv="Content-Security-Policy" content="default-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://www.gstatic.com https://firestore.googleapis.com https://firebasestorage.googleapis.com https://identitytoolkit.googleapis.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://www.gstatic.com;">"
        $content = $content -replace "<head>", "<head>
  $csp"
        $modified = $true
    }

    if ($content -notmatch "purify.min.js") {
        $purify = "<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script>"
        $content = $content -replace "</head>", "  $purify
</head>"
        $modified = $true
    }

    if ($content -notmatch "security.js") {
        # Determine relative path for utils/security.js
        $relPath = "utils/security.js"
        if ($file.Directory.Name -in "User", "Empresa", "Admin") {
            $relPath = "../utils/security.js"
        }
        $secScript = "<script src="$relPath"></script>"
        $content = $content -replace "</head>", "  $secScript
</head>"
        $modified = $true
    }

    if ($modified) {
        Set-Content $file.FullName $content -Encoding UTF8
    }
}
