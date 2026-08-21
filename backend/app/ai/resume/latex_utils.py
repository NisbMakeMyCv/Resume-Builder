def escape_latex(value: str) -> str:
    """
    Escape characters that have special meaning in normal LaTeX text.
    """

    if not value:
        return ""

    replacements = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }

    result = value

    for character, replacement in replacements.items():
        result = result.replace(character, replacement)

    return result


def escape_latex_url(value: str) -> str:
    """
    Escape a URL for safe use inside LaTeX \\href{}.
    """

    if not value:
        return ""

    return (
        value
        .replace("\\", r"\textbackslash{}")
        .replace("{", r"\{")
        .replace("}", r"\}")
        .replace("%", r"\%")
        .replace("#", r"\#")
        .replace(" ", r"\ ")
    )