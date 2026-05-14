CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGINT          NOT NULL AUTO_INCREMENT,
    recipient_id    BIGINT          NOT NULL,
    type            VARCHAR(50)     NOT NULL,
    title           VARCHAR(200)    NOT NULL,
    message         VARCHAR(1000)   NOT NULL,
    channel         VARCHAR(30)     NOT NULL,
    related_id      BIGINT,
    related_type    VARCHAR(50),
    is_read         TINYINT(1)      NOT NULL DEFAULT 0,
    sent_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id),
    INDEX idx_recipient_id (recipient_id),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
