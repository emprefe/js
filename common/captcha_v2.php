<?php
// user_manager/security/captcha.php - TTF VERSION
function captcha() {
    session_start();
    
    function generateCaptchaString() {
        $chars = "adfhjkprtwxy3479";
        return substr(str_shuffle($chars), 0, 5);
    }
    
    $captchakey = generateCaptchaString();
    $_SESSION['captcha_code'] = md5(strtolower($captchakey));
    
    $width = 140;  // Slightly wider for TTF fonts
    $height = 60;
    $captcha = imagecreatetruecolor($width, $height);
    
    $bgColor = imagecolorallocate($captcha, rand(200, 255), rand(200, 255), rand(200, 255));
    imagefilledrectangle($captcha, 0, 0, $width, $height, $bgColor);
    
    // Add more noise (dots and small lines) - SAME AS ORIGINAL
    for ($i = 0; $i < 300; $i++) {
        $dotColor = imagecolorallocate($captcha, rand(100, 200), rand(100, 200), rand(100, 200));
        imagesetpixel($captcha, rand(0, $width), rand(0, $height), $dotColor);
        if ($i % 10 == 0) {
            imageline($captcha, rand(0, $width), rand(0, $height), rand(0, $width), rand(0, $height), $dotColor);
        }
    }
    
    // Add wavy lines - SAME AS ORIGINAL
    $lineColor = imagecolorallocate($captcha, rand(50, 150), rand(50, 150), rand(50, 150));
    for ($i = 0; $i < rand(2, 4); $i++) {
        $amplitude = rand(3, 7);
        $frequency = rand(8, 12);
        $yOffset = rand(5, 35);
        for ($x = 0; $x < $width; $x += 1) {
            $y = $yOffset + sin($x / $frequency) * $amplitude;
            imagesetpixel($captcha, $x, $y, $lineColor);
        }
    }
    
    // Add small random solid shapes - SAME AS ORIGINAL
    for ($i = 0; $i < rand(3, 6); $i++) {
        $shapeColor = imagecolorallocate($captcha, rand(50, 150), rand(50, 150), rand(50, 150));
        imagefilledellipse($captcha, rand(0, $width), rand(0, $height), rand(5, 15), rand(5, 15), $shapeColor);
    }
    
    // Random lines at different angles - SAME AS ORIGINAL
    for ($i = 0; $i < rand(5, 10); $i++) {
        $lineColor = imagecolorallocate($captcha, rand(50, 150), rand(50, 150), rand(50, 150));
        imageline($captcha, rand(0, $width), rand(0, $height), rand(0, $width), rand(0, $height), $lineColor);
    }
    
    // TTF FONT SYSTEM - NEW!
    $font_paths = [
        __DIR__ . '/fonts/roboto.ttf',
        __DIR__ . '/fonts/opensans.ttf',
        __DIR__ . '/fonts/arial.ttf',
        __DIR__ . '/fonts/verdana.ttf'
    ];
    
    // Find available fonts
    $available_fonts = [];
    foreach ($font_paths as $font) {
        if (file_exists($font)) {
            $available_fonts[] = $font;
        }
    }
    
    // Text colors - multiple options for variety
    $text_colors = [
        [139, 0, 0],     // Dark red (original)
        [0, 0, 139],     // Dark blue
        [0, 100, 0],     // Dark green
        [139, 69, 19],   // Saddle brown
        [72, 61, 139]    // Dark slate blue
    ];
    
    $selected_color = $text_colors[array_rand($text_colors)];
    $textColor = imagecolorallocate($captcha, $selected_color[0], $selected_color[1], $selected_color[2]);
    
    // Draw text with TTF fonts or fallback to imagestring
    for ($i = 0; $i < 5; $i++) {
        $x = 15 + ($i * 22) + rand(-4, 4);  // Adjusted spacing for TTF
        $y = rand(35, 50);  // Y position for TTF (baseline, not top)
        
        $char = $captchakey[$i];
        
        if (!empty($available_fonts)) {
            // USE TTF FONTS
            $font = $available_fonts[array_rand($available_fonts)];  // Random font per character
            $size = rand(16, 20);  // Font size variation
            $angle = rand(-15, 15);  // Character rotation
            
            // Add subtle shadow effect for better readability
            $shadowColor = imagecolorallocate($captcha, 200, 200, 200);
            imagettftext($captcha, $size, $angle, $x + 1, $y + 1, $shadowColor, $font, $char);
            
            // Main character
            imagettftext($captcha, $size, $angle, $x, $y, $textColor, $font, $char);
            
        } else {
            // FALLBACK TO ORIGINAL SYSTEM FONT
            $fallback_y = rand(5, 40);  // Original Y positioning for imagestring
            imagestring($captcha, 5, $x, $fallback_y, $char, $textColor);
        }
    }
    
    // Optional: Add slight distortion for extra security (uncomment if needed)
    /*
    $distorted = imagecreatetruecolor($width, $height);
    for ($x = 0; $x < $width; $x++) {
        for ($y = 0; $y < $height; $y++) {
            $offset_x = $x + sin($y / 10) * 2;
            $offset_y = $y + sin($x / 10) * 2;
            
            if ($offset_x >= 0 && $offset_x < $width && $offset_y >= 0 && $offset_y < $height) {
                $color = imagecolorat($captcha, $offset_x, $offset_y);
                imagesetpixel($distorted, $x, $y, $color);
            }
        }
    }
    imagedestroy($captcha);
    $captcha = $distorted;
    */
    
    header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
    header("Cache-Control: no-cache, must-revalidate");
    header("Pragma: no-cache");
    header("Content-type: image/png");
    
    imagepng($captcha);
    imagedestroy($captcha);
}

captcha();
?>