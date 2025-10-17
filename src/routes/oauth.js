const express = require('express');
const router = express.Router();
const oauthController = require('../controllers/oauthController');

// OAuth 시작 - 인증 URL 반환
router.get('/:provider/start', oauthController.startOAuth);

// OAuth 콜백 - 플랫폼에서 리다이렉트
router.get('/:provider/callback', oauthController.handleCallback);

// 계정 연결 해제
router.post('/:provider/disconnect', oauthController.disconnect);

// 연결된 계정 목록 조회
router.get('/connections', oauthController.getConnectedAccounts);

module.exports = router;
