import { Request, Response, NextFunction } from "express";
import { get } from "lodash";
import { verifyJwt } from "../utils/jwt.utils";
import { reIssueAccessToken } from "../services/session.service";

const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = (req.get("authorization") ?? "").replace(/^Bearer\s/, "");
  const refreshToken = req.get("x-refresh") ?? "";

  if (!accessToken) {
    return next();
  }

  const { decoded, expired } = verifyJwt(accessToken, "accessTokenSecret");

  if (decoded) {
    res.locals.user = decoded;
    res.locals.session = get(decoded, "session");
    return next();
  }

  if (expired && refreshToken) {
    const newAccessToken = await reIssueAccessToken({ refreshToken });

    if (newAccessToken) {
      res.setHeader("x-access-token", newAccessToken);
    }

    const result = verifyJwt(newAccessToken, "accessTokenSecret");

    res.locals.user = result.decoded;
    res.locals.session = get(result.decoded, "session", null);
    return next();
  }

  return next();
};

export default deserializeUser;
