const media = {
    resolutions: {
        "360p": {
            width: 640,
            height: 360,
            label: "360p"
        },

        "720p": {
            width: 1280,
            height: 720,
            label: "720p"
        },

        "1080p": {
            width: 1920,
            height: 1080,
            label: "1080p"
        },

        "1440p": {
            width: 2560,
            height: 1440,
            label: "1440p"
        },

        "2160p": {
            width: 3840,
            height: 2160,
            label: "2160p"
        }
    },

    image: {
        type: "image",

        mimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ],

        extensions: [
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".gif"
        ],

        maxSize: 10 * 1024 * 1024,

        preview: true,
        downloadable: true
    },

    video: {
        type: "video",

        mimeTypes: [
            "video/mp4",
            "video/webm",
            "video/ogg",
            "video/quicktime"
        ],

        extensions: [
            ".mp4",
            ".webm",
            ".ogv",
            ".mov"
        ],

        maxSize: 500 * 1024 * 1024,

        resolutions: [
            "360p",
            "720p",
            "1080p",
            "1440p",
            "2160p"
        ],

        preview: true,
        downloadable: true
    },

    audio: {
        type: "audio",

        mimeTypes: [
            "audio/mpeg",
            "audio/mp4",
            "audio/wav",
            "audio/ogg",
            "audio/webm",
            "audio/aac",
            "audio/x-m4a"
        ],

        extensions: [
            ".mp3",
            ".mp4",
            ".wav",
            ".ogg",
            ".webm",
            ".aac",
            ".m4a"
        ],

        maxSize: 100 * 1024 * 1024,

        preview: true,
        downloadable: true
    },

    document: {
        type: "document",

        mimeTypes: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain",
            "text/csv"
        ],

        extensions: [
            ".pdf",
            ".doc",
            ".docx",
            ".xls",
            ".xlsx",
            ".ppt",
            ".pptx",
            ".txt",
            ".csv"
        ],

        maxSize: 50 * 1024 * 1024,

        preview: false,
        downloadable: true
    },

    archive: {
        type: "archive",

        mimeTypes: [
            "application/zip",
            "application/x-rar-compressed",
            "application/x-7z-compressed",
            "application/gzip"
        ],

        extensions: [
            ".zip",
            ".rar",
            ".7z",
            ".gz"
        ],

        maxSize: 500 * 1024 * 1024,

        preview: false,
        downloadable: true
    },

    screen: {
        type: "screen",

        realtime: true,

        protocol: "webrtc",

        resolutions: [
            "360p",
            "720p",
            "1080p",
            "1440p",
            "2160p"
        ],

        frameRates: [
            15,
            24,
            30,
            60
        ],

        video: {
            enabled: true,

            codecs: [
                "VP8",
                "VP9",
                "H264",
                "AV1"
            ]
        },

        audio: {
            enabled: true,

            codecs: [
                "opus"
            ],

            sampleRates: [
                48000
            ],

            channels: [
                1,
                2
            ]
        },

        capture: {
            screen: true,
            window: true,
            tab: true,
            systemAudio: true
        }
    }
} as const;

export default media;