export const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.role) {
            return res.status(403).json({ msg: "Akses ditolak. Token Anda tidak memiliki informasi role." });
        }
        if (!allowedRoles.includes(req.role.toLowerCase())) {
            return res.status(403).json({ msg: "Akses dilarang. Role Anda (" + req.role + ") tidak memiliki izin ini." });
        }
        next();
    };
};