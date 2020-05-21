// Ignore these classes for now, just doing some rough modeling
class Article {
    constructor() {
        this.sections = [];
    }
}

class Section {
    constructor() {
        this.content = [];
    }
}

class Content {
    constructor(schema, version) {
        this.schema = `${schema}/${version}`;
    }
}

class Paragraph extends Content {
    constructor() {
        super('paragraph', '1.0');
        this.facts = [];
    }
}

class Annotation {
}

class Fact extends Content {
    constructor() {
        super('fact', '1.0');
        this.text = '';
        this.annotations = [];
    }
}

class Infobox extends Content {
}

class Image extends Content {
}

class Quote extends Content {
}
