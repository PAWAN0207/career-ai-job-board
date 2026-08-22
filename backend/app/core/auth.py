from fastapi import Header, HTTPException
from app.core.supabase import supabase


# ============================================================
# GET CURRENT AUTHENTICATED USER
# ============================================================

def get_current_user(
    authorization: str | None = Header(default=None)
):
    """
    Validate the Supabase access token sent by the frontend.

    Expected header:

        Authorization: Bearer <access_token>

    Returns the authenticated Supabase user.
    """

    # --------------------------------------------------------
    # CHECK HEADER
    # --------------------------------------------------------

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    # --------------------------------------------------------
    # CHECK BEARER FORMAT
    # --------------------------------------------------------

    parts = authorization.split(
        " ",
        1
    )

    if (
        len(parts) != 2
        or parts[0].lower() != "bearer"
        or not parts[1].strip()
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header."
        )

    access_token = (
        parts[1].strip()
    )

    # --------------------------------------------------------
    # VERIFY TOKEN WITH SUPABASE
    # --------------------------------------------------------

    try:

        response = (
            supabase.auth.get_user(
                access_token
            )
        )

        user = getattr(
            response,
            "user",
            None
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired authentication token."
            )

        return user

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=401,
            detail=(
                "Unable to verify authentication token."
            )
        ) from e