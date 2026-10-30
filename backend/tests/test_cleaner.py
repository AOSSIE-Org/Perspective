from app.modules.scraper.cleaner import clean_extracted_text


def test_keeps_sentences_that_contain_boilerplate_words():
    text = (
        "An engine powered by hydrogen could drive a car for five hundred kilometres.\n"
        "Readers asked about using the new tool in newsrooms around the world.\n"
        "The photo by the river showed how far the water had risen overnight.\n"
        "Officials said the advertisement campaign would run until the end of May.\n"
        "About using the app offline, the team said support is still being planned.\n"
        "Read more atomic physics books if you want to understand the subject.\n"
        "Advertisement spending increased across the country last year."
    )

    assert clean_extracted_text(text) == text.replace("\n", "\n\n")


def test_removes_boilerplate_lines():
    text = (
        "The council approved the new budget after a long debate on Tuesday.\n"
        "Read more at example.com about the city council and its members\n"
        "Sign up for our newsletter to get the latest stories every morning\n"
        "© 2026 Example News Network, a part of Example Media Group\n"
        "Residents will see the changes in their bills starting next month."
    )

    assert clean_extracted_text(text) == (
        "The council approved the new budget after a long debate on Tuesday.\n\n"
        "Residents will see the changes in their bills starting next month."
    )
