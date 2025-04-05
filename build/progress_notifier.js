export function createProgressNotifier(server) {
    let lastProgress = 0;
    function createNotification(status, progressToken) {
        let progress = lastProgress;
        const total = 100;
        if (status.progress_data?.length) {
            const item = status.progress_data[0];
            if (item &&
                typeof item.index === "number" &&
                typeof item.length === "number") {
                const stepProgress = (item.index / (item.length - 1)) * 80;
                progress = Math.round(10 + stepProgress);
            }
        }
        else {
            switch (status.stage) {
                case "pending":
                    progress = status.queue ? (status.position === 0 ? 10 : 5) : 15;
                    break;
                case "generating":
                    progress = 50;
                    break;
                case "complete":
                    progress = 100;
                    break;
                case "error":
                    progress = lastProgress;
                    break;
            }
        }
        progress = Math.max(progress, lastProgress);
        if (status.stage === "complete") {
            progress = 100;
        }
        else if (progress === lastProgress && lastProgress >= 75) {
            progress = Math.min(99, lastProgress + 1);
        }
        lastProgress = progress;
        let message = status.message;
        if (!message) {
            if (status.queue && status.position !== undefined) {
                message = `Queued at position ${status.position}`;
            }
            else if (status.progress_data?.length) {
                const item = status.progress_data[0];
                message = item.desc || `Step ${item.index + 1} of ${item.length}`;
            }
            else {
                message = status.stage.charAt(0).toUpperCase() + status.stage.slice(1);
            }
        }
        return {
            method: "notifications/progress",
            params: {
                progressToken,
                progress,
                total,
                message,
                _meta: status,
            },
        };
    }
    return {
        async notify(status, progressToken) {
            if (!progressToken)
                return;
            const notification = createNotification(status, progressToken);
            await server.notification(notification);
        },
    };
}
