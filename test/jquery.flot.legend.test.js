describe('jquery.flot.legend', function () {

    describe('.getLineWidth', function() {
        it('should return a sensible default value', function() {
            expect(getLineWidth(options)).toBe(15);
        });
    });

    describe('.tokenizeStatement', function() {
        it('should always insert a space for statement that include badges', function() {
            var tokens = tokenizeStatement({
                value: '%g'
            });
            expect(tokens.length).toBe(2);
            expect(tokens[0].type).toBe(TOKENS.Badge);
            expect(tokens[1].type).toBe(TOKENS.Text);
            expect(tokens[1].value).toBe(' ');
        });
    });
});
