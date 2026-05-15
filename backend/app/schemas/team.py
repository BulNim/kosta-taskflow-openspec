from pydantic import BaseModel, EmailStr, Field


class TeamCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class TeamJoinIn(BaseModel):
    invite_code: str = Field(min_length=9, max_length=9, pattern=r"^[A-Z0-9]{4}-[A-Z0-9]{4}$")


class TeamOut(BaseModel):
    id: int
    name: str
    invite_code: str
    owner_id: int

    model_config = {"from_attributes": True}


class MemberOut(BaseModel):
    id: int
    email: EmailStr

    model_config = {"from_attributes": True}
